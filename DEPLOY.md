# Deploy-runbook

Eenmalige server-setup om Weekschema te draaien op je eigen Linux-server
(Docker + Tailscale zijn er al), met automatische deploys via GitHub Actions
bij elke push naar `main`. Alleen bereikbaar via je tailnet -- geen publieke
poorten, geen reverse proxy nodig.

Er zijn **twee verschillende SSH-sleutelparen** in dit verhaal, in
tegengestelde richting -- houd ze niet door elkaar:

- **Sleutel A (server → GitHub)**: zodat de server de private repo kan
  clonen/pullen. Publieke helft als "Deploy key" op de GitHub-repo,
  privésleutel blijft op de server.
- **Sleutel B (GitHub Actions → server)**: zodat de CI-workflow via SSH kan
  inloggen om `deploy.sh` te draaien. Publieke helft in
  `~/.ssh/authorized_keys` op de server, privésleutel als GitHub secret.

## 0. Lokaal: repo naar GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Maak op github.com een lege (private of public) repo aan, bv. `weekschema`.
Voeg 'm toe als remote en push:

```bash
git remote add origin git@github.com:<jouw-account>/weekschema.git
git branch -M main
git push -u origin main
```

## 1. Server: repo clonen

Als de repo **public** is, kun je stap "Sleutel A" overslaan en gewoon
`git clone https://github.com/<jouw-account>/weekschema.git` gebruiken.

Voor een **private** repo, eenmalig op de server:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/weekschema_deploy_key -N ""
cat ~/.ssh/weekschema_deploy_key.pub
```

Zet die public key op GitHub: repo → Settings → Deploy keys → Add deploy key
(read-only volstaat). Configureer git om 'm te gebruiken en clone dan:

```bash
mkdir -p /opt/weekschema && cd /opt/weekschema
GIT_SSH_COMMAND="ssh -i ~/.ssh/weekschema_deploy_key" \
  git clone git@github.com:<jouw-account>/weekschema.git .
git config core.sshCommand "ssh -i ~/.ssh/weekschema_deploy_key"
```

## 2. Server: `.env` aanmaken

```bash
cp .env.example .env
```

Vul in:
- `DATABASE_URL` -- laat op de waarde die al in `.env.example` staat; in
  productie wordt DATABASE_URL toch overschreven door `docker-compose.prod.yml`
  zodat de app-service de `db`-service binnen het compose-netwerk vindt.
- `BETTER_AUTH_SECRET` -- genereer met `openssl rand -base64 32`.
- `BETTER_AUTH_URL` -- de HTTPS-URL die je zo via Tailscale krijgt, zie
  stap 4 (bv. `https://weekschema-server.your-tailnet.ts.net`). Kun je pas
  invullen ná stap 4, dus doe stap 2 en 4 samen.
- `ANTHROPIC_API_KEY` -- optioneel, alleen nodig voor "Recept importeren".

## 3. Server: eerste handmatige deploy

```bash
chmod +x deploy.sh
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec -T app npm run db:migrate
```

De app luistert nu alleen op `127.0.0.1:3000` -- expres niet publiek en niet
eens LAN-breed bereikbaar, zie de comment in `docker-compose.prod.yml`.

## 4. Server: bereikbaar maken via Tailscale

Eenmalig in de Tailscale-adminconsole (login.tailscale.com) onder
**Settings → HTTPS Certificates**: zet dit aan als het nog niet aanstaat.

Op de server:

```bash
sudo tailscale serve --bg 3000
tailscale serve status   # controleer de URL
```

Dit proxyt HTTPS-verkeer uit je tailnet naar `localhost:3000`, met een
automatisch Let's Encrypt-certificaat van Tailscale. De URL die je nu krijgt
(iets als `https://<machinenaam>.<tailnet-naam>.ts.net`) is wat je in `.env`
als `BETTER_AUTH_URL` zet (stap 2) -- pas daarna aan en herstart de app:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Test vanaf een ander toestel dat ook in je tailnet zit (telefoon met
Tailscale-app, laptop): open de URL. **Let op voor later**: de kiosk-tablet
(`/kiosk`) moet, zodra die er is, ook de Tailscale-app geïnstalleerd en
ingelogd hebben in hetzelfde tailnet om erbij te kunnen.

## 5. GitHub: CI → tailnet toegang (OAuth client)

Tailscale-adminconsole → **Settings → OAuth clients** → Generate OAuth
client. Geef 'm een tag, bv. `tag:ci`. Bewaar de **Client ID** en
**Client secret** (die laatste zie je maar één keer).

Als je een custom ACL-policy hebt (Access controls in de adminconsole),
zorg dat `tag:ci` verbinding mag maken met je server-tag/host. Op de
standaard/gratis ACL (alles mag met alles praten binnen je tailnet) hoef je
niets aan te passen.

## 6. GitHub: SSH-sleutel voor de deploy-stap (Sleutel B)

Lokaal of op de server, maak een **apart** sleutelpaar (niet hetzelfde als
sleutel A hierboven):

```bash
ssh-keygen -t ed25519 -f ./github_deploy_key -N ""
```

Zet de **public** key in `~/.ssh/authorized_keys` van de gebruiker op de
server waarmee gedeployed wordt:

```bash
cat github_deploy_key.pub >> ~/.ssh/authorized_keys   # op de server
```

De **private** key (`github_deploy_key`, zonder `.pub`) gebruik je zo als
GitHub secret. Verwijder 'm daarna lokaal.

## 7. GitHub: secrets instellen

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Waarde |
|---|---|
| `TS_OAUTH_CLIENT_ID` | uit stap 5 |
| `TS_OAUTH_SECRET` | uit stap 5 |
| `DEPLOY_HOST` | Tailscale-hostname van je server (`tailscale status` op de server, of de `.ts.net`-naam uit stap 4 zonder `https://`) |
| `DEPLOY_USER` | de SSH-gebruiker op de server (bv. `loek`) |
| `DEPLOY_SSH_KEY` | volledige inhoud van de **private** sleutel uit stap 6 |

`.github/workflows/deploy.yml` verwacht de repo op `/opt/weekschema` op de
server (zie `script: bash /opt/weekschema/deploy.sh`) -- pas dat pad aan in
de workflow als je een andere locatie hebt gebruikt in stap 1.

## 8. Klaar -- workflow vanaf nu

- **Dev**: blijft ongewijzigd op je Windows-machine, `docker compose up`
  (het gewone, niet-`.prod`-bestand), met live-reload zoals altijd.
- **Deploy**: commit + `git push` naar `main` → GitHub Actions draait
  `nuxt typecheck` als eerste check, verbindt daarna via Tailscale met je
  server, en voert `deploy.sh` uit (`git reset --hard origin/main`,
  image herbouwen, herstarten, migraties draaien, oude images opruimen).
- Wil je een deploy handmatig herhalen op de server zelf (zonder GitHub)?
  `bash /opt/weekschema/deploy.sh`.
- Logs bekijken op de server: `docker compose -f docker-compose.prod.yml logs -f app`.
- Database-backup: `docker compose -f docker-compose.prod.yml exec db pg_dump -U weekplanner weekplanner > backup.sql`.
