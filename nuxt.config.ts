import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap"
        }
      ]
    }
  },
  devServer: {
    host: process.env.NUXT_HOST || "0.0.0.0",
    port: Number(process.env.NUXT_PORT) || 3000
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
        interval: 300
      },
      hmr: {
        clientPort: 3000
      }
    }
  },
  runtimeConfig: {
    // server-only (not exposed to client)
    databaseUrl: process.env.DATABASE_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    public: {
      authBaseUrl: process.env.BETTER_AUTH_URL || "http://localhost:3000"
    }
  },
  nitro: {
    preset: "node-server"
  },
  // Uitgezet: de gegenereerde route-scoring types botsen met better-auth's
  // catch-all route (/api/auth/[...all]) en laten vue-tsc vastlopen op
  // "Excessive stack depth". We gebruiken toch nergens typed route-namen.
  experimental: {
    typedPages: false
  }
});
