FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
# Zorgt dat deze map altijd bestaat, ook als het (licentiegebonden, niet
# gecommit -- zie .gitignore) NEVO-databestand niet aanwezig is. Anders
# faalt de COPY hieronder in de run-stage hard op een ontbrekend pad.
RUN mkdir -p server/utils/NEVO
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
# node_modules + drizzle-config/migrations blijven nodig na de build, puur om
# `npm run db:migrate` (drizzle-kit) in dit image te kunnen draaien bij elke
# deploy -- de Nuxt-server zelf draait alleen op .output.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/drizzle ./drizzle
# NEVO-fallback voor ingrediëntenzoekopdrachten (server/utils/nevo.ts) --
# leeg als het databestand niet aanwezig was bij het bouwen, dan valt die
# zoekfunctie vanzelf terug op alleen Albert Heijn.
COPY --from=build /app/server/utils/NEVO ./server/utils/NEVO
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
