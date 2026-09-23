// De app volgt standaard het systeemthema (prefers-color-scheme, zie
// assets/css/main.css). Alleen de kiosk heeft een handmatige licht/donker-
// toggle: die keuze wordt per toestel onthouden en als .light/.dark class op
// <html> gezet, en weer weggehaald zodra je de kiosk verlaat.
export type KioskTheme = "light" | "dark";

export const KIOSK_THEME_STORAGE_KEY = "weekschema-kiosk-theme";

// Draait al in <head> vóór de eerste paint, zodat de tablet niet eerst even
// in het verkeerde thema opflitst (zie layouts/kiosk.vue).
export const KIOSK_THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${KIOSK_THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}`;

function systemTheme(): KioskTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: KioskTheme | null) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme) root.classList.add(theme);
}

export function useKioskTheme() {
  const theme = ref<KioskTheme>("light");

  onMounted(() => {
    const opgeslagen = localStorage.getItem(KIOSK_THEME_STORAGE_KEY);
    theme.value = opgeslagen === "light" || opgeslagen === "dark" ? opgeslagen : systemTheme();
    applyTheme(opgeslagen === "light" || opgeslagen === "dark" ? opgeslagen : null);
  });

  onUnmounted(() => applyTheme(null));

  function toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark";
    localStorage.setItem(KIOSK_THEME_STORAGE_KEY, theme.value);
    applyTheme(theme.value);
  }

  return { theme, toggle };
}
