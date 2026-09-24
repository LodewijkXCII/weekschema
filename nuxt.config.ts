import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  devtools: { enabled: true },
  modules: ["@vite-pwa/nuxt"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      meta: [
        { name: "theme-color", content: "#1f6f3d" },
        // iOS: fullscreen (zonder Safari-balken) openen vanaf het
        // beginscherm -- werkt daar ook zonder HTTPS/service worker.
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "Weekschema" }
      ],
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon-180x180.png" },
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
  // Installeerbaar als app (beginscherm/kiosk-tablet). Iconen in public/
  // zijn gegenereerd uit public/icon.svg. De service worker cachet bewust
  // alleen de statische build-bestanden (JS/CSS/iconen/fonts), nooit
  // pagina's of /api -- alle data is live en achter een login, een
  // gecachte versie daarvan zou verouderd of van een andere sessie zijn.
  // Let op: browsers registreren een service worker alleen via HTTPS (of
  // localhost), zie DEPLOY.md.
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Weekschema",
      short_name: "Weekschema",
      description: "Gedeelde weekmenu-planner",
      lang: "nl",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#1f6f3d",
      background_color: "#faf8ed",
      icons: [
        { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
        { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
      ]
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ["**/*.{js,css,png,svg,ico,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts",
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] }
          }
        }
      ]
    },
    client: {
      installPrompt: false
    },
    devOptions: {
      enabled: false
    }
  },
  // Uitgezet: de gegenereerde route-scoring types botsen met better-auth's
  // catch-all route (/api/auth/[...all]) en laten vue-tsc vastlopen op
  // "Excessive stack depth". We gebruiken toch nergens typed route-namen.
  experimental: {
    typedPages: false
  }
});
