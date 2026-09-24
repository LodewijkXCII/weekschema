// Stuurt niet-ingelogde bezoekers naar /login. Alleen login en registreren
// zijn zonder sessie bereikbaar -- de rest (ook de kiosk) heeft toch data
// van het huishouden nodig, en de API's geven zonder sessie alleen een 401.
//
// Bewust via $fetch op better-auth's eigen endpoint i.p.v. useAuthClient():
// tijdens SSR moet de cookie van de binnenkomende request mee, en roept
// Nuxt' $fetch de eigen server-route direct aan -- geen afhankelijkheid van
// een base-URL (zie composables/useAuthClient.ts voor waarom dat lastig is).
const PUBLIC_ROUTES = ["/login", "/register"];

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_ROUTES.includes(to.path)) return;

  const session = await $fetch<{ user?: unknown } | null>("/api/auth/get-session", {
    headers: useRequestHeaders(["cookie"])
  }).catch(() => null);

  if (!session?.user) {
    return navigateTo({ path: "/login", query: to.fullPath !== "/" ? { redirect: to.fullPath } : undefined });
  }
});
