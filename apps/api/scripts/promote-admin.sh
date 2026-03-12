#!/usr/bin/env bash
# Promotes a user to admin role by their Twitch ID.
# Usage: ./scripts/promote-admin.sh <twitch_id> [--remote]
#
# Local:  ./scripts/promote-admin.sh 123456789
# Remote: ./scripts/promote-admin.sh 123456789 --remote

set -euo pipefail

TWITCH_ID="${1:?Usage: $0 <twitch_id> [--remote]}"

# Validate numeric to prevent injection
if ! [[ "$TWITCH_ID" =~ ^[0-9]+$ ]]; then
  echo "Error: Twitch ID must be numeric"
  exit 1
fi

REMOTE=""
if [[ "${2:-}" == "--remote" ]]; then
  REMOTE="--remote"
fi

echo "Promoting user with Twitch ID '$TWITCH_ID' to admin role..."
npx wrangler d1 execute fangdash-db ${REMOTE:---local} --command "UPDATE user SET role = 'admin' WHERE twitch_id = '$TWITCH_ID';"
echo "Done."
