#!/usr/bin/env bash
# Promotes a Twitch user to admin role by Twitch username.
# Usage: ./scripts/promote-admin.sh <twitch_username> [--remote]
#
# Local:  ./scripts/promote-admin.sh mrdemonwolf
# Remote: ./scripts/promote-admin.sh mrdemonwolf --remote

set -euo pipefail

USERNAME="${1:?Usage: $0 <twitch_username> [--remote]}"
REMOTE=""
if [[ "${2:-}" == "--remote" ]]; then
  REMOTE="--remote"
fi

echo "Promoting user '$USERNAME' to admin role..."
npx wrangler d1 execute fangdash-db ${REMOTE:---local} --command "UPDATE user SET role = 'admin' WHERE name = '$USERNAME';"
echo "Done."
