#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose down
echo 'Maxel stopped. PostgreSQL data is preserved in its Docker volume.'
