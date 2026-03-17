#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# FangDash Production Data Reconciliation Script
#
# Audits and fixes player aggregate stats, achievements, and skin unlocks
# by recalculating from source-of-truth tables (score, race_history).
#
# Usage:
#   bash scripts/reconcile-stats.sh [--remote] [--dry-run]
#
# Flags:
#   --remote   Run against production D1 (default: --local)
#   --dry-run  Audit only, skip phases 1-5
# =============================================================================

DB_NAME="fangdash-db"
D1_FLAGS="--local"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --remote) D1_FLAGS="--remote" ;;
    --dry-run) DRY_RUN=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

run_sql() {
  local sql="$1"
  bunx wrangler d1 execute "$DB_NAME" $D1_FLAGS --command "$sql"
}

echo "============================================"
echo "FangDash Data Reconciliation"
echo "============================================"
echo "Mode: $D1_FLAGS"
echo "Dry run: $DRY_RUN"
echo ""

# --------------------------------------------------------------------------
# Phase 0: Audit (read-only)
# --------------------------------------------------------------------------
echo "=== Phase 0: Audit ==="
echo "Checking for mismatches between stored stats and computed stats..."
echo ""

echo "--- Solo score aggregate mismatches ---"
run_sql "
SELECT
  p.id,
  p.total_score,
  COALESCE(computed.sum_score, 0) AS computed_total_score,
  p.total_distance,
  COALESCE(computed.sum_distance, 0) AS computed_total_distance,
  p.total_obstacles_cleared,
  COALESCE(computed.sum_obstacles, 0) AS computed_total_obstacles,
  p.games_played,
  COALESCE(computed.cnt, 0) AS computed_games_played
FROM player p
LEFT JOIN (
  SELECT
    player_id,
    SUM(score) AS sum_score,
    SUM(distance) AS sum_distance,
    SUM(obstacles_cleared) AS sum_obstacles,
    COUNT(*) AS cnt
  FROM score
  GROUP BY player_id
) computed ON computed.player_id = p.id
WHERE p.total_score != COALESCE(computed.sum_score, 0)
   OR p.total_distance != COALESCE(computed.sum_distance, 0)
   OR p.total_obstacles_cleared != COALESCE(computed.sum_obstacles, 0)
   OR p.games_played != COALESCE(computed.cnt, 0);
"

echo ""
echo "--- Race stat mismatches ---"
run_sql "
SELECT
  p.id,
  p.races_played,
  COALESCE(computed.cnt, 0) AS computed_races_played,
  p.races_won,
  COALESCE(computed.won, 0) AS computed_races_won
FROM player p
LEFT JOIN (
  SELECT
    player_id,
    COUNT(*) AS cnt,
    SUM(CASE WHEN placement = 1 THEN 1 ELSE 0 END) AS won
  FROM race_history
  GROUP BY player_id
) computed ON computed.player_id = p.id
WHERE p.races_played != COALESCE(computed.cnt, 0)
   OR p.races_won != COALESCE(computed.won, 0);
"

echo ""
echo "--- XP mismatches ---"
run_sql "
SELECT
  p.id,
  p.total_xp,
  COALESCE(solo.sum_score, 0)
    + COALESCE(race.sum_race_xp, 0) AS computed_total_xp
FROM player p
LEFT JOIN (
  SELECT player_id, SUM(score) AS sum_score
  FROM score
  GROUP BY player_id
) solo ON solo.player_id = p.id
LEFT JOIN (
  SELECT player_id,
    SUM(score + CASE placement
      WHEN 1 THEN 500
      WHEN 2 THEN 250
      WHEN 3 THEN 100
      ELSE 0
    END) AS sum_race_xp
  FROM race_history
  GROUP BY player_id
) race ON race.player_id = p.id
WHERE p.total_xp != COALESCE(solo.sum_score, 0) + COALESCE(race.sum_race_xp, 0);
"

if $DRY_RUN; then
  echo ""
  echo "Dry run complete. No changes made."
  exit 0
fi

# --------------------------------------------------------------------------
# Phase 1: Fix aggregate stats from score table
# --------------------------------------------------------------------------
echo ""
echo "=== Phase 1: Fix aggregate stats from score table ==="
run_sql "
UPDATE player SET
  total_score = COALESCE((SELECT SUM(score) FROM score WHERE player_id = player.id), 0),
  total_distance = COALESCE((SELECT SUM(distance) FROM score WHERE player_id = player.id), 0),
  total_obstacles_cleared = COALESCE((SELECT SUM(obstacles_cleared) FROM score WHERE player_id = player.id), 0),
  games_played = COALESCE((SELECT COUNT(*) FROM score WHERE player_id = player.id), 0),
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now');
"
echo "Done."

# --------------------------------------------------------------------------
# Phase 2: Fix race stats from race_history table
# --------------------------------------------------------------------------
echo ""
echo "=== Phase 2: Fix race stats from race_history table ==="
run_sql "
UPDATE player SET
  races_played = COALESCE((SELECT COUNT(*) FROM race_history WHERE player_id = player.id), 0),
  races_won = COALESCE((SELECT SUM(CASE WHEN placement = 1 THEN 1 ELSE 0 END) FROM race_history WHERE player_id = player.id), 0),
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now');
"
echo "Done."

# --------------------------------------------------------------------------
# Phase 3: Fix totalXp and level
# --------------------------------------------------------------------------
echo ""
echo "=== Phase 3: Fix totalXp and level ==="

# Build level CASE WHEN ladder
# Formula: totalXpForLevel(n) = 5 * (n-1)^3
# So: level = max n where total_xp >= 5*(n-1)^3
LEVEL_CASE="CASE"
for (( n=100; n>=2; n-- )); do
  threshold=$(( 5 * (n-1) * (n-1) * (n-1) ))
  LEVEL_CASE="$LEVEL_CASE WHEN total_xp >= $threshold THEN $n"
done
LEVEL_CASE="$LEVEL_CASE ELSE 1 END"

run_sql "
UPDATE player SET
  total_xp = COALESCE((SELECT SUM(score) FROM score WHERE player_id = player.id), 0)
           + COALESCE((SELECT SUM(score + CASE placement
               WHEN 1 THEN 500
               WHEN 2 THEN 250
               WHEN 3 THEN 100
               ELSE 0
             END) FROM race_history WHERE player_id = player.id), 0),
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now');
"

# Level must be set after XP is updated
run_sql "
UPDATE player SET
  level = $LEVEL_CASE,
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now');
"
echo "Done."

# --------------------------------------------------------------------------
# Phase 4: Grant missing achievements
# --------------------------------------------------------------------------
echo ""
echo "=== Phase 4: Grant missing achievements ==="

UUID_EXPR="lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6)))"

# Helper: grant achievement for players with MAX(column) >= threshold in score table
grant_score_max_achievement() {
  local ach_id="$1" col="$2" threshold="$3"
  echo "  Checking: $ach_id (max $col >= $threshold)"
  run_sql "
INSERT INTO player_achievement (id, player_id, achievement_id, unlocked_at)
SELECT $UUID_EXPR, s.player_id, '$ach_id', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM (
  SELECT player_id, MAX($col) AS max_val
  FROM score
  GROUP BY player_id
  HAVING max_val >= $threshold
) s
WHERE NOT EXISTS (
  SELECT 1 FROM player_achievement pa
  WHERE pa.player_id = s.player_id AND pa.achievement_id = '$ach_id'
);
"
}

# Achievements based on MAX(score) from score table
grant_score_max_achievement "first-fang" "score" 100
grant_score_max_achievement "sharp-fangs" "score" 1000
grant_score_max_achievement "apex-predator" "score" 10000

# Achievements based on MAX(distance) from score table
grant_score_max_achievement "first-steps" "distance" 500
grant_score_max_achievement "marathon-runner" "distance" 5000

# Achievement based on MAX(longest_clean_run) from score table
echo "  Checking: perfect-dash (max longest_clean_run >= 1000)"
run_sql "
INSERT INTO player_achievement (id, player_id, achievement_id, unlocked_at)
SELECT $UUID_EXPR, s.player_id, 'perfect-dash', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM (
  SELECT player_id, MAX(longest_clean_run) AS max_lcr
  FROM score
  GROUP BY player_id
  HAVING max_lcr >= 1000
) s
WHERE NOT EXISTS (
  SELECT 1 FROM player_achievement pa
  WHERE pa.player_id = s.player_id AND pa.achievement_id = 'perfect-dash'
);
"

# Helper: grant achievement for players matching a condition on the player table
grant_player_achievement() {
  local ach_id="$1" condition="$2"
  echo "  Checking: $ach_id ($condition)"
  run_sql "
INSERT INTO player_achievement (id, player_id, achievement_id, unlocked_at)
SELECT $UUID_EXPR, p.id, '$ach_id', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM player p
WHERE p.$condition
  AND NOT EXISTS (
    SELECT 1 FROM player_achievement pa
    WHERE pa.player_id = p.id AND pa.achievement_id = '$ach_id'
  );
"
}

# Achievements based on player table aggregates
grant_player_achievement "score-hoarder" "total_score >= 50000"
grant_player_achievement "world-traveler" "total_distance >= 50000"
grant_player_achievement "pup" "games_played >= 1"
grant_player_achievement "pack-member" "games_played >= 25"
grant_player_achievement "lone-wolf" "games_played >= 100"
grant_player_achievement "obstacle-dodger" "total_obstacles_cleared >= 100"
grant_player_achievement "obstacle-master" "total_obstacles_cleared >= 1000"
grant_player_achievement "first-race" "races_played >= 1"
grant_player_achievement "champion" "races_won >= 10"
grant_player_achievement "veteran-racer" "races_played >= 50"

echo "Done."

# --------------------------------------------------------------------------
# Phase 5: Grant missing skins
# --------------------------------------------------------------------------
echo ""
echo "=== Phase 5: Grant missing skins ==="

# gray-wolf: default for all players
echo "  Checking: gray-wolf (default for all players)"
run_sql "
INSERT INTO player_skin (id, player_id, skin_id, unlocked_at)
SELECT $UUID_EXPR, p.id, 'gray-wolf', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM player p
WHERE NOT EXISTS (
  SELECT 1 FROM player_skin ps
  WHERE ps.player_id = p.id AND ps.skin_id = 'gray-wolf'
);
"

# shadow-wolf: MAX(distance) >= 2000
echo "  Checking: shadow-wolf (max distance >= 2000)"
run_sql "
INSERT INTO player_skin (id, player_id, skin_id, unlocked_at)
SELECT $UUID_EXPR, s.player_id, 'shadow-wolf', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM (
  SELECT player_id, MAX(distance) AS max_distance
  FROM score
  GROUP BY player_id
  HAVING max_distance >= 2000
) s
WHERE NOT EXISTS (
  SELECT 1 FROM player_skin ps
  WHERE ps.player_id = s.player_id AND ps.skin_id = 'shadow-wolf'
);
"

# fire-wolf: MAX(score) >= 5000
echo "  Checking: fire-wolf (max score >= 5000)"
run_sql "
INSERT INTO player_skin (id, player_id, skin_id, unlocked_at)
SELECT $UUID_EXPR, s.player_id, 'fire-wolf', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM (
  SELECT player_id, MAX(score) AS max_score
  FROM score
  GROUP BY player_id
  HAVING max_score >= 5000
) s
WHERE NOT EXISTS (
  SELECT 1 FROM player_skin ps
  WHERE ps.player_id = s.player_id AND ps.skin_id = 'fire-wolf'
);
"

# storm-wolf: has achievement obstacle-master
echo "  Checking: storm-wolf (has obstacle-master achievement)"
run_sql "
INSERT INTO player_skin (id, player_id, skin_id, unlocked_at)
SELECT $UUID_EXPR, pa.player_id, 'storm-wolf', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM player_achievement pa
WHERE pa.achievement_id = 'obstacle-master'
  AND NOT EXISTS (
    SELECT 1 FROM player_skin ps
    WHERE ps.player_id = pa.player_id AND ps.skin_id = 'storm-wolf'
  );
"

# blood-moon-wolf: MAX(score) >= 15000
echo "  Checking: blood-moon-wolf (max score >= 15000)"
run_sql "
INSERT INTO player_skin (id, player_id, skin_id, unlocked_at)
SELECT $UUID_EXPR, s.player_id, 'blood-moon-wolf', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM (
  SELECT player_id, MAX(score) AS max_score
  FROM score
  GROUP BY player_id
  HAVING max_score >= 15000
) s
WHERE NOT EXISTS (
  SELECT 1 FROM player_skin ps
  WHERE ps.player_id = s.player_id AND ps.skin_id = 'blood-moon-wolf'
);
"

# mrdemonwolf: has achievement champion
echo "  Checking: mrdemonwolf (has champion achievement)"
run_sql "
INSERT INTO player_skin (id, player_id, skin_id, unlocked_at)
SELECT $UUID_EXPR, pa.player_id, 'mrdemonwolf', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM player_achievement pa
WHERE pa.achievement_id = 'champion'
  AND NOT EXISTS (
    SELECT 1 FROM player_skin ps
    WHERE ps.player_id = pa.player_id AND ps.skin_id = 'mrdemonwolf'
  );
"

echo "Done."

echo ""
echo "============================================"
echo "Reconciliation complete!"
echo "============================================"
