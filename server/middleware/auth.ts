import { auth } from "../utils/auth";

// Als server/api/auth/[...all].ts staat dit catch-all handlerpad in Nitro's
// typed-fetch route-manifest, wat vue-tsc laat vastlopen op "Excessive stack
// depth" (bekend Nitro-probleem met splat-routes in de route-scoring types).
// Als middleware wordt het pad niet meegenomen in die manifest-generatie,
// terwijl het gedrag identiek blijft.
export default defineEventHandler((event) => {
  if (!event.path.startsWith("/api/auth/")) return;
  return auth.handler(toWebRequest(event));
});
