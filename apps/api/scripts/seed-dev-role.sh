#!/usr/bin/env bash
# Seeds the dev role for a given email address in the local D1 database.
# Usage: ./scripts/seed-dev-role.sh <email>
# Example: ./scripts/seed-dev-role.sh nathanial.henniges@mrdemonwolf.com
#
# This script is for LOCAL/DEV environments only. Never run in production.

set -euo pipefail

EMAIL="${1:?Usage: $0 <email>}"

echo "Setting role='dev' for email: $EMAIL"
npx wrangler d1 execute fangdash-db --local --command "UPDATE user SET role = 'dev' WHERE email = '$EMAIL';"
echo "Done."
