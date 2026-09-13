import { createAuthClient } from "better-auth/vue";

let client: ReturnType<typeof createAuthClient> | null = null;

// Lazily created so it picks up runtimeConfig.public.authBaseUrl on the client.
export function useAuthClient() {
  if (!client) {
    const config = useRuntimeConfig();
    client = createAuthClient({ baseURL: config.public.authBaseUrl });
  }
  return client;
}
