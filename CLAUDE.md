# Weekschema -- context voor Claude Agent

Gedeelde weekmenu-planner voor 2 personen (huishouden): recepten met
macro-tracking, een weekbord, boodschappenlijst, en een fullscreen
kiosk-weergave voor een keukentablet.

## Stack
- **Nuxt 3** -- frontend (Vue) + server API routes (Nitro)
- **Tailwind CSS v4** -- design tokens (OKLCH-kleuren, Bricolage Grotesque
  + DM Sans) overgenomen van een Lovable-referentieontwerp, zie
  `assets/css/main.css`. `layouts/default.vue` is de normale app-chrome
  (header/nav); `layouts/kiosk.vue` is bewust kaal (geen nav) voor
  `pages/kiosk.vue`.
- **Drizzle ORM** + **Postgres** -- data
- **better-auth** -- login, email/wachtwoord, gedeeld tussen 2 accounts
  via een uitnodigingscode (zie households/householdMembers)
- **Anthropic Claude API** (`server/utils/claude.ts`) -- recept-import
  vanaf URL/tekst/foto, met een eigen `ANTHROPIC_API_KEY` (kosten op het
  eigen account van de gebruiker, geen gedeelde key)
- Deploy: zelf gehost via Docker Compose op een Raspberry Pi, alleen
  bereikbaar binnen het thuisnetwerk plus via **Twingate** voor toegang van
  buitenaf (geen publieke poorten). Deploys gaan automatisch via GitHub
  Actions bij een push naar `main` op de publieke repo
  `LodewijkXCII/weekschema`
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
- Een recept-ingrediënt bewaart zowel de **ingevoerde** hoeveelheid+eenheid
  (`hoeveelheid`/`eenheid` -- gram/ml/l/eetlepel/theelepel/snufje/stuks,
  puur voor weergave "tijdens het koken") als de omgerekende
  `hoeveelheidGram` (de enige bron van waarheid voor macro-berekeningen).
  Die omrekening gebeurt altijd server-side
  (`server/utils/ingredientUnits.ts`), nooit op een door de client
  aangeleverde `hoeveelheidGram` vertrouwd. De eenheid "stuks" heeft geen
  vaste factor -- die gebruikt `gramPerStuk` van het gekozen ingrediënt
  zelf, en faalt met een duidelijke fout als dat niet is ingesteld.
- Ingrediënten uit een geïmporteerd recept worden alleen **automatisch**
  gekoppeld aan een bestaand ingrediënt bij een exacte naamsovereenkomst.
  Een bevat-relatie of gedeeld eerste woord (bv. "sweet soy sauce" vs.
  "soy sauce") wordt hooguit een klikbare suggestie, nooit stilzwijgend
  samengevoegd -- verschillende varianten kunnen echt andere macro's hebben.
- Een `weekPlan` heeft altijd precies 7 dagen x 5 momenten = 35
  `mealSlots`, aangemaakt bij het eerste bezoek aan die week
  (`server/api/weekplans/[week].get.ts`). Slots worden nooit los
  aangemaakt/verwijderd, alleen hun `recipeId` wordt gezet/leeggemaakt.
- Elk `mealSlot` heeft een optioneel `personen` (stapjes van 0,5), in te
  stellen per vakje op het weekbord. `null` = standaard: 2,5 bij ontbijt en
  diner, anders het aantal porties van het recept (1 voor een los
  ingrediënt) -- zie `slotPersonen()` in `composables/useMealMoments.ts`. De
  boodschappenlijst schaalt hier per vakje op.
- Alle data is scoped op `householdId`, niet op losse users -- elke
  API-route gebruikt `requireHousehold(event)` uit
  `server/utils/session.ts` om dit af te dwingen.
- Voedingswaarden komen live van Albert Heijn (onofficiële mobiele
  app-API, `server/utils/ahApi.ts`) met NEVO (RIVM/Voedingscentrum,
  `server/utils/nevo.ts`) als fallback voor generieke/rauwe ingrediënten
  (NEVO staat altijd vóórop in de resultaten voor dat soort zoekopdrachten).
  Het NEVO-databestand staat **niet** in git (licentievoorwaarden) --
  ontbreekt het lokaal, dan valt de zoekfunctie vanzelf terug op alleen AH.

## Status / nog te doen
- Draait lokaal via Docker Compose (`docker compose up`) en wordt actief
  ontwikkeld/getest; `server/db/auth-schema.ts` is al gegenereerd via
  `npm run auth:generate`, geen placeholder meer.
- Grotendeels compleet: weekbord (drag&drop, week kopiëren, auto-vullen,
  notities, "wie kookt", meerdere doelprofielen), recepten (favorieten,
  tags, duimpjes, portie-schuifje, kook-modus, import via URL/tekst/foto),
  ingrediënten (overzicht, live AH/NEVO-zoeken, bewerken, zoekbare
  ingrediënt-picker), boodschappenlijst (gesorteerd op winkelcategorie),
  trends, en de kiosk-weergave voor een keukentablet.
- Nog te doen: de Broodje Dunner-recepten handmatig overtypen via de
  bestaande invoerformulieren; op de Pi de Twingate Resources/Service
  Account/GitHub-secrets afmaken zodat automatische deploys ook echt
  werken (zie `DEPLOY.md` stap 6 t/m 9).

Zie `README.md` voor volledige setup- en deploy-instructies.
