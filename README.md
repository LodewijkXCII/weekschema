# Weekschema

Gedeelde weekmenu-planner voor 2 personen: recepten met ingrediënten en
macro's (kcal/eiwit/vet/koolhydraten), een weekbord met 5 vaste eetmomenten
per dag (ontbijt, tussendoor, lunch, tussendoor, diner), en per dag een
optelling van nutriënten tegen een zelf ingesteld maximum.

Stack: **Nuxt 3** (frontend + server API routes) · **Drizzle ORM** + **Postgres**
(data) · **better-auth** (login, gedeeld tussen 2 accounts via een
uitnodigingscode) · zelf gehost via Docker Compose, bereikbaar via
**Tailscale** (zie `DEPLOY.md`).

## 1. Lokaal opzetten (alles in Docker)

Alles -- Postgres én de Nuxt dev-server -- draait in Docker Compose. Er is
geen lokale Node/npm-installatie nodig; je hebt alleen Docker Desktop nodig.
De dev-server draait met live-reload: bestanden opslaan (op je eigen
machine) ververst de app automatisch, zonder dat je een image hoeft te
herbouwen.

```bash
cp .env.example .env
# BETTER_AUTH_SECRET: genereer een echte waarde, bv.
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

docker compose up -d --build
docker compose logs -f app     # wachten tot Nuxt "ready" meldt (Ctrl+C om te stoppen met volgen)
```

De `pgcrypto`-extensie (nodig voor de UUID-kolommen) wordt automatisch
aangezet via `docker/init-pgcrypto.sql`, dat bij het eerste opstarten van de
`db`-service wordt uitgevoerd.

Genereer eerst de echte better-auth kerntabellen (user/session/account/verification) --
het meegeleverde `server/db/auth-schema.ts` is een handmatig geschreven
placeholder zodat het project meteen type-checkt, maar laat 'm regenereren
zodra de containers draaien (eenmalig, altijd via de `app`-container zodat
Node-versie en `DATABASE_URL` consistent blijven):

```bash
docker compose exec app npm run auth:generate
```

Genereer en zet daarna alle tabellen (incl. onze eigen schema.ts) in de database:

```bash
docker compose exec app npm run db:generate
docker compose exec app npm run db:migrate
```

Open http://localhost:3000, registreer een account (kies "Nieuw huishouden"),
en geef de uitnodigingscode op de Instellingen-pagina aan je partner zodat
die met "Uitnodigingscode" hetzelfde huishouden kan joinen.

Na deze eerste keer volstaat `docker compose up -d` (zonder `--build`, tenzij
je `package.json` hebt aangepast) om de hele stack weer te starten. Nieuwe
dependency toevoegen: `docker compose exec app npm install <package>`
(schrijft `package.json`/`package-lock.json` terug naar je eigen machine via
de bind mount).

### Zonder Docker (optioneel)

Wil je toch liever rechtstreeks op je eigen machine draaien: start alleen de
`db`-service (`docker compose up -d db`), zet `DATABASE_URL` in `.env` op
`postgres://weekplanner:weekplanner@localhost:5432/weekplanner`, en gebruik
`npm install` / `npm run auth:generate` / `npm run db:generate` /
`npm run db:migrate` / `npm run dev` zoals gebruikelijk.

## 2. Structuur

```
server/db/schema.ts        applicatie-tabellen (households, ingredients,
                            recipes, recipe_ingredients, daily_targets,
                            week_plans, meal_slots)
server/db/auth-schema.ts   better-auth kerntabellen (regenereren met
                            npm run auth:generate)
server/utils/auth.ts       better-auth configuratie
server/utils/session.ts    requireHousehold() -- auth + huishouden-check
                            voor elke API-route
server/api/**              REST endpoints (ingredients, recipes, targets,
                            weekplans/[week], mealslots, household)
pages/**                   login, register, week-overzicht (drag & drop),
                            recepten, ingrediënten, instellingen
components/MetricBar.vue   het kleine voortgangsbalkje per nutriënt
```

## 3. Deployen

Productie draait op een eigen Linux-server via Docker Compose, alleen
bereikbaar via Tailscale (geen publieke poorten). Elke push naar `main`
deployt automatisch via GitHub Actions. Zie **`DEPLOY.md`** voor de volledige
eenmalige server-setup (Tailscale, SSH-deploysleutel, GitHub secrets) en
`docker-compose.prod.yml` / `deploy.sh` voor hoe een deploy er inhoudelijk
uitziet.

## 4. Nog te doen (bewust buiten scope gehouden voor de eerste versie)

- Recepten uit Broodje Dunner overtypen via de invoerformulieren.
- ~~Tablet-dashboard-weergave~~ -- gedaan, zie `/kiosk` (eigen layout zonder
  navigatie, grote kaarten per eetmoment, wisselt zelf van dag/week om
  middernacht, ververst elke 2 minuten -- bedoeld voor een vast gemonteerde
  tablet in de keuken).
- ~~Boodschappenlijst: gerechten van een week optellen tot een checklist~~ --
  gedaan, zie `/boodschappen` (per gerecht aantal personen instelbaar in
  stapjes van 0,5, aangevinkte items zijn te kopiëren als tijdelijke
  export). Nog open: een **echte** koppeling met de Albert
  Heijn-boodschappenlijst (deeplink/API) in plaats van kopiëren-plakken.
- ~~Macro's automatisch invullen bij een nieuw ingrediënt~~ -- gedaan, zie
  `/ingredients/new` (live zoeken bij Albert Heijn via
  `server/utils/ahApi.ts` / `server/api/ingredients/search.get.ts`).
  **Let op**: dit gebruikt AH's onofficiële, niet-gedocumenteerde mobiele
  app-API (dezelfde die de Appie-app zelf gebruikt) -- die kan zonder
  aankondiging wijzigen of stoppen met werken. Handmatig invullen blijft
  daarom altijd mogelijk als fallback.
- ~~Recepten importeren vanaf URL, geplakte tekst of een foto~~ -- gedaan,
  zie `/recipes/new` ("Recept importeren") en `server/api/recipes/extract.post.ts`
  (Claude API, jouw eigen `ANTHROPIC_API_KEY`). Werkt voor de meeste
  receptensites en losse tekst/foto's; Instagram-posts specifiek kunnen
  falen omdat Instagram scrapers actief blokkeert -- handmatig invoeren
  blijft dan de fallback.
