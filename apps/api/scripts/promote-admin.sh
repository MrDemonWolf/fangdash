#!/usr/bin/env bash
# Promotes users to a role by their Twitch username (case-insensitive).
# Usage: ./scripts/promote-admin.sh [--remote] [--role <role>] <username> [username2 ...]
#
# Examples:
#   ./scripts/promote-admin.sh MrDemonWolf
#   ./scripts/promote-admin.sh MrDemonWolf SomeOtherUser
#   ./scripts/promote-admin.sh MrDemonWolf --remote
#   ./scripts/promote-admin.sh MrDemonWolf --role dev

set -euo pipefail

REMOTE=""
ROLE="admin"
USERNAMES=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE="--remote"
      shift
      ;;
    --role)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --role requires a value"
        exit 1
      fi
      ROLE="$2"
      shift 2
      ;;
    --*)
      echo "Error: Unknown flag '$1'"
      echo "Usage: $0 [--remote] [--role <role>] <username> [username2 ...]"
      exit 1
      ;;
    *)
      USERNAMES+=("$1")
      shift
      ;;
  esac
done

if [[ ${#USERNAMES[@]} -eq 0 ]]; then
  echo "Error: At least one Twitch username is required"
  echo "Usage: $0 [--remote] [--role <role>] <username> [username2 ...]"
  exit 1
fi

# Validate role — alphanumeric and underscores only
if ! [[ "$ROLE" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
  echo "Error: Role must be alphanumeric (got '$ROLE')"
  exit 1
fi

DB_FLAG="${REMOTE:---local}"

for USERNAME in "${USERNAMES[@]}"; do
  # Validate username — alphanumeric, underscores, hyphens only (Twitch rules)
  if ! [[ "$USERNAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "FAIL: Invalid username '$USERNAME' (must be alphanumeric, underscores, or hyphens)"
    continue
  fi

  # Convert to lowercase for case-insensitive match (Twitch usernames are case-insensitive)
  LOWER_USERNAME=$(echo "$USERNAME" | tr '[:upper:]' '[:lower:]')

  echo "Setting role '$ROLE' for user '$USERNAME'..."

  RESULT=$(bunx wrangler d1 execute fangdash-db $DB_FLAG \
    --command "UPDATE user SET role = '$ROLE' WHERE LOWER(name) = '$LOWER_USERNAME';" \
    2>&1) || {
    echo "FAIL: Could not update '$USERNAME' — wrangler error"
    echo "$RESULT"
    continue
  }

  # Verify the user was found by checking if any row was updated
  VERIFY=$(bunx wrangler d1 execute fangdash-db $DB_FLAG \
    --command "SELECT name, role FROM user WHERE LOWER(name) = '$LOWER_USERNAME';" \
    2>&1) || {
    echo "WARN: Update ran but could not verify '$USERNAME'"
    continue
  }

  if echo "$VERIFY" | grep -qi "$LOWER_USERNAME"; then
    echo "OK: '$USERNAME' is now '$ROLE'"
  else
    echo "FAIL: No user found with username '$USERNAME'"
  fi
done
