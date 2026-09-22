import { createAuthClient } from "better-auth/vue";

let client: ReturnType<typeof createAuthClient> | null = null;

// Lazily created. In de browser altijd het huidige origin gebruiken i.p.v.
// runtimeConfig.public.authBaseUrl: die wordt tijdens `npm run build` in de
// Docker-image gebakken, waar .env niet aanwezig is (zie .dockerignore), dus
// daar staat 'ie vast op http://localhost:3000 -- cross-origin vanaf de Pi's
// LAN-IP of een Twingate-adres, en dus een CORS-fout. Same-origin werkt
// ongeacht via welk adres de app geopend wordt.
export function useAuthClient() {
  if (!client) {
    const config = useRuntimeConfig();
    const baseURL = import.meta.client ? window.location.origin : config.public.authBaseUrl;
    client = createAuthClient({ baseURL });
  }
  return client;
}
