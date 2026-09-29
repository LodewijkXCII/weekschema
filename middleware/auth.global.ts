// Stuurt niet-ingelogde bezoekers naar /login. Alleen login en registreren
// zijn zonder sessie bereikbaar -- de rest (ook de kiosk) heeft toch data
// van het huishouden nodig, en de API's geven zonder sessie alleen een 401.
// Wie wel ingelogd is maar nog niet in een huishouden zit (bv. omdat de
// uitnodigingscode bij het registreren fout was), gaat naar /huishouden om
// alsnog een code in te voeren of een huishouden aan te maken.
//
// Bewust via $fetch op een eigen server-route i.p.v. useAuthClient():
// tijdens SSR moet de cookie van de binnenkomende request mee, en roept
// Nuxt' $fetch de eigen server-route direct aan -- geen afhankelijkheid van
// een base-URL (zie composables/useAuthClient.ts voor waarom dat lastig is).
const PUBLIC_ROUTES = ["/login", "/register"];
const ONBOARDING_ROUTE = "/huishouden";

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_ROUTES.includes(to.path)) return;

  const status = await $fetch<{ loggedIn: boolean; hasHousehold: boolean }>("/api/household/status", {
    headers: useRequestHeaders(["cookie"])
  }).catch(() => null);

  if (!status?.loggedIn) {
    return navigateTo({ path: "/login", query: to.fullPath !== "/" ? { redirect: to.fullPath } : undefined });
  }

  if (!status.hasHousehold && to.path !== ONBOARDING_ROUTE) {
    return navigateTo(ONBOARDING_ROUTE);
  }
});
