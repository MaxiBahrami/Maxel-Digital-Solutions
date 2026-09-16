#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v docker >/dev/null 2>&1; then
  echo 'Install and start Docker Desktop, then run this command again.'
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo 'Start Docker Desktop and wait until it is ready, then try again.'
  exit 1
fi
if [ ! -f .env ]; then
  if ! command -v openssl >/dev/null 2>&1; then echo 'OpenSSL is required to create local passwords.'; exit 1; fi
  umask 077
  maxel_db_password=$(openssl rand -hex 24)
  maxel_admin_password=$(openssl rand -hex 16)
  maxel_session_secret=$(openssl rand -hex 32)
  printf 'APP_ORIGIN=http://localhost:8080\nPOSTGRES_PASSWORD=%s\nADMIN_PASSWORD=%s\nSESSION_SECRET=%s\n' "$maxel_db_password" "$maxel_admin_password" "$maxel_session_secret" > .env
  echo 'Created private local settings in .env.'
  printf 'Your new studio password: %s\n' "$maxel_admin_password"
else
  echo 'Using your existing .env settings. Your studio password is ADMIN_PASSWORD in that file.'
fi
docker compose up -d --build --wait --wait-timeout 180
echo 'Website: http://localhost:8080'
echo 'Studio inbox: http://localhost:8080/admin/'
echo 'Stop with: bash scripts/dev-down.sh'
