# Deploy-runbook

Eenmalige setup om Weekschema te draaien op een **Raspberry Pi (4 of 5,
4GB+ RAM)**, die zowel de server als het touchscreen-display is: Chromium
draait lokaal in kiosk-modus en toont `/kiosk` fullscreen op het aangesloten
scherm, terwijl dezelfde Pi ook de hele Docker-stack (Nuxt + Postgres) host.
Bereikbaar op afstand (telefoon, laptop) via **Twingate** -- geen publieke
poorten, geen reverse proxy nodig. Automatische deploys via GitHub Actions
bij elke push naar `main`.

**Belangrijk**: gebruik de **64-bit** versie van Raspberry Pi OS
("Raspberry Pi OS (64-bit) with desktop"), niet de 32-bit of Lite-variant --
Node 22's officiële Docker images ondersteunen geen 32-bit ARM meer, en voor
kiosk-modus is een desktopomgeving nodig.

**Hoe Twingate hier past**: in tegenstelling tot een peer-to-peer mesh-VPN
(zoals Tailscale) werkt Twingate met een **Connector** (draait hier als
Docker-service op de Pi, legt een uitgaande verbinding met Twingate's cloud)
en **Resources** die je in de admin console definieert -- een IP+poort die
via die Connector bereikbaar wordt voor toegestane gebruikers/service
accounts. Dat betekent: geen automatische HTTPS-certificaten zoals
Tailscale's `serve` die gaf, en de Resource moet het **echte LAN-IP** van de
Pi zijn (niet `127.0.0.1` -- dat adres onderschept een extern toestel nooit,
elk apparaat heeft zijn eigen loopback). De app draait daarom gewoon over
HTTP binnen je vertrouwde thuisnetwerk + Twingate-tunnel; dat was toch al je
threat model (LAN-toegang was al prima, het ging om geen publieke
internet-blootstelling).

De repo is **public** (`github.com/LodewijkXCII/weekschema`), dus de Pi
heeft geen eigen sleutel nodig om 'm te clonen -- dat gaat gewoon via
`https://`. Er is wel **één SSH-sleutelpaar** nodig, in deze richting:

- **GitHub Actions → Pi**: zodat de CI-workflow via SSH kan inloggen om
  `deploy.sh` te draaien. Publieke helft in `~/.ssh/authorized_keys` op de
  Pi, privésleutel als GitHub secret (stap 8).

## 0. Pi voorbereiden

Flash Raspberry Pi OS (64-bit, with desktop) op de SD-kaart (via Raspberry Pi
Imager -- zet daar meteen hostname, SSH-toegang en wifi in via de
geavanceerde opties, dan hoef je geen scherm/toetsenbord aan te sluiten voor
deze stap).

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER      # opnieuw inloggen na deze regel
```

Stel daarna in je router een **DHCP-reservering** in voor de Pi's
MAC-adres, zodat 'ie altijd hetzelfde LAN-IP krijgt (bv. `192.168.1.50`) --
dat adres gebruik je zo als Twingate Resource-adres en als
`BETTER_AUTH_URL`. Zonder reservering kan dat IP wijzigen en breekt beide.

**SD-kaart-tip**: Postgres schrijft continu naar schijf; een goedkope
SD-kaart kan daardoor sneller slijten/corrupt raken dan je zou willen op een
apparaat dat 24/7 aanstaat. Een A2-rated SD-kaart, of nog beter, booten vanaf
een USB-SSD (Pi 4/5 ondersteunen dit) is een prijs-waardige upgrade als dit
lang moet meegaan. Niet verplicht om te beginnen.

## 1. Lokaal: repo naar GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Maak op github.com een lege **public** repo aan onder `LodewijkXCII`, bv.
`weekschema` (New repository → Public, geen README/`.gitignore` aanvinken,
die staan er al). Met de `gh`-CLI kan dat ook in één keer vanuit deze map:

```bash
gh repo create LodewijkXCII/weekschema --public --source=. --remote=origin --push
```

Zonder `gh`: maak 'm handmatig aan op github.com, voeg 'm dan toe als
remote en push:

```bash
git remote add origin https://github.com/LodewijkXCII/weekschema.git
git branch -M main
git push -u origin main
```

## 2. Pi: repo clonen

Repo is public, dus gewoon over `https://`, geen sleutel nodig:

```bash
sudo mkdir -p /opt/weekschema && sudo chown $USER /opt/weekschema
git clone https://github.com/LodewijkXCII/weekschema.git /opt/weekschema
cd /opt/weekschema
```

## 3. Twingate: Remote Network + Connector aanmaken

In de Twingate admin console (`<jouw-tenant>.twingate.com`):

1. **Team → Remote Networks** → nieuw Remote Network aanmaken, bv.
   `thuis-pi`.
2. Daarbinnen een **Connector** toevoegen → kies Docker als
   deploymentmethode. De console genereert nu een kant-en-klaar
   `docker run`/`docker-compose`-fragment met een echte
   `TWINGATE_ACCESS_TOKEN` en `TWINGATE_REFRESH_TOKEN` -- **kopieer die
   waarden** (samen met je tenant-naam als `TWINGATE_NETWORK`), er is al een
   `twingate-connector`-service met de juiste vorm klaarstaand in
   `docker-compose.prod.yml`, je hoeft alleen de tokens over te nemen.

## 4. Pi: `.env` aanmaken

```bash
cp .env.example .env
```

Vul in:
- `DATABASE_URL` -- laat op de waarde die al in `.env.example` staat; in
  productie wordt DATABASE_URL toch overschreven door `docker-compose.prod.yml`
  zodat de app-service de `db`-service binnen het compose-netwerk vindt.
- `BETTER_AUTH_SECRET` -- genereer met `openssl rand -base64 32`.
- `BETTER_AUTH_URL` -- `http://<pi-lan-ip>:3000` (het vaste IP uit stap 0).
- `ANTHROPIC_API_KEY` -- optioneel, alleen nodig voor "Recept importeren".
- `TWINGATE_NETWORK` / `TWINGATE_ACCESS_TOKEN` / `TWINGATE_REFRESH_TOKEN` --
  uit stap 3.

## 5. Pi: eerste handmatige deploy

```bash
chmod +x deploy.sh
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec -T app npm run db:migrate
```

Dit bouwt het image rechtstreeks op de Pi (ARM64) -- dat werkt hier prima
gezien de 4GB+ RAM, geen cross-compilatie nodig, en start meteen ook de
Twingate-connector mee (die zou nu "Connected" moeten tonen in de admin
console, onder het Remote Network van stap 3). De app luistert op poort 3000
op alle interfaces -- bereikbaar binnen je thuisnetwerk, en straks via
Twingate ook daarbuiten. Niet publiek op het internet.

## 6. Twingate: Resources aanmaken

In de admin console, binnen hetzelfde Remote Network (**Resources → Add**),
twee aparte Resources aanmaken (los houden = losse toegangspolicies, de
CI-runner heeft bv. geen webtoegang nodig en jij geen SSH-toegang vanaf je
telefoon):

1. **Weekschema Web** -- adres `<pi-lan-ip>`, poort `3000`. Ken toegang toe
   aan je eigen gebruikers-/groepsaccount (jij + je partner) zodat je 'm
   vanaf je telefoon/laptop kan openen zodra de Twingate-app daar draait en
   ingelogd is.
2. **Weekschema SSH** -- adres `<pi-lan-ip>`, poort `22`. Toegang hiervoor
   ken je zo aan de CI-service account toe (stap 7) -- nog niet aan
   jezelf nodig, tenzij je ook zelf via Twingate wil SSH'en.

## 7. GitHub: CI → Twingate toegang (Service Account)

Admin console → **Settings → Service Accounts** → nieuwe service account
aanmaken (bv. `github-ci`). Genereer daarbinnen een **Service Key** en
bewaar 'm -- die zie je maar één keer.

Ken deze service account toegang toe tot de **Weekschema SSH**-resource uit
stap 6 (via een Access Policy/Security Policy op die resource, niet meer).
Zo kan de CI-runner straks alleen bij SSH op de Pi, niets anders.

## 8. GitHub: SSH-sleutel voor de deploy-stap

Lokaal of op de Pi, maak een sleutelpaar aan speciaal voor deze CI-stap:

```bash
ssh-keygen -t ed25519 -f ./github_deploy_key -N ""
```

Zet de **public** key in `~/.ssh/authorized_keys` van de gebruiker op de Pi
waarmee gedeployed wordt:

```bash
cat github_deploy_key.pub >> ~/.ssh/authorized_keys   # op de Pi
```

De **private** key (`github_deploy_key`, zonder `.pub`) gebruik je zo als
GitHub secret. Verwijder 'm daarna lokaal.

## 9. GitHub: secrets instellen

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Waarde |
|---|---|
| `TWINGATE_SERVICE_KEY` | volledige inhoud van de service key uit stap 7 |
| `DEPLOY_HOST` | het vaste LAN-IP van de Pi uit stap 0 |
| `DEPLOY_USER` | de SSH-gebruiker op de Pi (bv. `pi`) |
| `DEPLOY_SSH_KEY` | volledige inhoud van de **private** sleutel uit stap 8 |

`.github/workflows/deploy.yml` verwacht de repo op `/opt/weekschema` op de
Pi (zie `script: bash /opt/weekschema/deploy.sh`) -- pas dat pad aan in de
workflow als je een andere locatie hebt gebruikt in stap 2.

## 10. Touchscreen kiosk-modus (Pi = server + scherm)

Dit configureert de Pi's eigen desktopomgeving om na het opstarten
automatisch, zonder inloggen, Chromium fullscreen op `/kiosk` te tonen op
het aangesloten touchscreen.

**Belangrijk**: laat Chromium naar **hetzelfde adres als `BETTER_AUTH_URL`**
wijzen (`http://<pi-lan-ip>:3000`), niet naar `http://localhost:3000`. Twee
verschillende origins (localhost vs. het LAN-IP) voor dezelfde app betekent
twee losse cookie-jars/sessies voor better-auth -- verwarrend en onnodig. De
Pi kan zijn eigen LAN-IP gewoon rechtstreeks bereiken, ook lokaal, zonder
dat Twingate daarvoor nodig is (dat is alleen voor toestellen buiten je LAN).

Auto-login naar het bureaublad instellen:

```bash
sudo raspi-config
# System Options -> Boot / Auto Login -> Desktop Autologin
# Display Options -> Screen Blanking -> uitzetten (touchscreen moet altijd aan blijven)
```

Raspberry Pi OS (Bookworm en later) gebruikt **labwc** (Wayland) als
standaard-compositor. Het Chromium-binary heet, afhankelijk van je
OS-versie, `chromium` of `chromium-browser` -- check met
`which chromium chromium-browser` welke van de twee bestaat, en gebruik die
hieronder.

```bash
mkdir -p ~/.config/labwc
cat >> ~/.config/labwc/autostart <<'EOF'
chromium --kiosk --noerrdialogs --disable-infobars \
  --incognito --disable-session-crashed-bubble \
  --app=http://<pi-lan-ip>:3000/kiosk &
EOF
```

(Draait de Pi nog op het oudere X11/LXDE -- controleer met
`echo $XDG_SESSION_TYPE` -- gebruik dan
`~/.config/lxsession/LXDE-pi/autostart` met dezelfde Chromium-regel in
plaats van het labwc-bestand.)

De eerste keer moet je zelf inloggen in de Chromium-kiosk (er is geen
aparte no-auth kiosk-modus) -- daarna onthoudt het Chromium-profiel de
sessie, ook na een herstart van de Pi.

## 11. Klaar -- workflow vanaf nu

- **Dev**: blijft ongewijzigd op je Windows-machine, `docker compose up`
  (het gewone, niet-`.prod`-bestand), met live-reload zoals altijd.
- **Deploy**: commit + `git push` naar `main` → GitHub Actions draait
  `nuxt typecheck` als eerste check, verbindt daarna via Twingate met de
  Pi (SSH-resource, stap 6/7), en voert `deploy.sh` uit
  (`git reset --hard origin/main`, image herbouwen op de Pi zelf,
  herstarten, migraties draaien, oude images opruimen).
- Wil je een deploy handmatig herhalen op de Pi zelf (zonder GitHub)?
  `bash /opt/weekschema/deploy.sh`.
- Logs bekijken op de Pi: `docker compose -f docker-compose.prod.yml logs -f app`.
- Database-backup: `docker compose -f docker-compose.prod.yml exec db pg_dump -U weekplanner weekplanner > backup.sql`.
- Vanaf je telefoon/laptop buiten het thuisnetwerk: installeer de Twingate-app,
  log in, en open `http://<pi-lan-ip>:3000` zodra "Weekschema Web" als
  Resource aan jouw account is toegekend (stap 6).
