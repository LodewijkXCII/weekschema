# Weekschema -- context voor Claude Agent

Gedeelde weekmenu-planner voor 2 personen (huishouden), gebouwd om
recepten uit een los aangeschafte ebook-app over te nemen en zelf te
beheren met macro-tracking.

## Stack
- **Nuxt 3** -- frontend (Vue) + server API routes (Nitro)
- **Drizzle ORM** + **Postgres** -- data
- **better-auth** -- login, email/wachtwoord, gedeeld tussen 2 accounts
  via een uitnodigingscode (zie households/householdMembers)
- Deploy: zelf gehost via Docker Compose op een Raspberry Pi, alleen
  bereikbaar binnen het thuisnetwerk plus via **Twingate** voor toegang van
  buitenaf (geen publieke poorten). Deploys gaan automatisch via GitHub
  Actions bij een push naar `main`
  (zie `.github/workflows/deploy.yml`, `docker-compose.prod.yml`,
  `deploy.sh` en `DEPLOY.md` voor de volledige eenmalige server-setup).

## Belangrijke domeinregels
- Er zijn **5 vaste eetmomenten per dag**: ontbijt, tussendoor, lunch,
  tussendoor, diner (`ontbijt`, `tussendoor_1`, `lunch`, `tussendoor_2`,
  `diner` -- zie `composables/useMealMoments.ts` en
  `server/db/schema.ts:MEAL_MOMENTS`). Deze volgorde en namen niet
  veranderen zonder de UI en API mee te updaten.
- Macro's (kcal/eiwit/vet/koolhydraten) worden altijd opgeslagen **per
  100 gram** op het ingrediënt, en berekend/opgeteld server-side (nooit
  client-side hardcoden).
- Een `weekPlan` heeft altijd precies 7 dagen x 5 momenten = 35
  `mealSlots`, aangemaakt bij het eerste bezoek aan die week
  (`server/api/weekplans/[week].get.ts`). Slots worden nooit los
  aangemaakt/verwijderd, alleen hun `recipeId` wordt gezet/leeggemaakt.
- Alle data is scoped op `householdId`, niet op losse users -- elke
  API-route gebruikt `requireHousehold(event)` uit
  `server/utils/session.ts` om dit af te dwingen.

## Status / nog te doen
- Draait lokaal via Docker Compose (`docker compose up`) en wordt actief
  ontwikkeld/getest; `server/db/auth-schema.ts` is al gegenereerd via
  `npm run auth:generate`, geen placeholder meer.
- Nog te doen: de Broodje Dunner-recepten handmatig overtypen via de
  bestaande invoerformulieren.

Zie `README.md` voor volledige setup- en deploy-instructies.
