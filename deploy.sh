#!/usr/bin/env bash
# Draait OP de server (via SSH vanuit GitHub Actions, of handmatig). Haalt de
# laatste main-branch op, bouwt een nieuwe image en herstart de stack, met
# een pending-migratie erna. Verwacht dat dit script al in de gekloonde repo
# staat, bv. /opt/weekschema/deploy.sh, met een .env ernaast (niet in git).
set -euo pipefail
cd "$(dirname "$0")"

git fetch origin main
git reset --hard origin/main

# Versie-indicator (header van de app): welke commit hier draait.
export GIT_SHA="$(git rev-parse HEAD)"
export BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Deploy van commit $GIT_SHA"

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec -T app npm run db:migrate

# Oude, ongebruikte images opruimen zodat de schijf niet vollopt na elke deploy.
docker image prune -f
