// Haalt een webpagina op t.b.v. recept-import. Probeert eerst schema.org
// Recipe-markup (JSON-LD) te vinden -- vrijwel elke kookblog heeft dit voor
// Google's rich snippets, en het levert veel schonere input voor Claude dan
// de ruwe pagina-HTML. Zonder JSON-LD valt het terug op platte tekst van de
// hele pagina.
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "db", "app"]);
const PRIVATE_IP_RE = /^(10\.|127\.|0\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;

export function assertSafeImportUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Ongeldige URL" });
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw createError({ statusCode: 400, statusMessage: "Alleen http(s)-URL's zijn toegestaan" });
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || PRIVATE_IP_RE.test(host)) {
    throw createError({ statusCode: 400, statusMessage: "Deze URL is niet toegestaan" });
  }
  return url;
}

async function fetchHtml(url: URL): Promise<string | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; WeekschemaRecipeImport/1.0)" },
    signal: AbortSignal.timeout(15000)
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.text();
}

const PINTEREST_HOSTS = new Set(["pinterest.com", "www.pinterest.com", "pin.it"]);
// Domeinen waar het niet zinvol is de outbound link naartoe te volgen --
// meestal een inlogmuur of geen bruikbare paginatekst voor niet-ingelogde
// bezoekers.
const UNHELPFUL_OUTBOUND_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "pinterest.com",
  "www.pinterest.com"
]);

// Pinterest-pagina's zijn een client-side gerenderde React-app -- de
// zichtbare/statische HTML bevat vrijwel geen tekst (alles zit in een
// hydration-script), en de pin-beschrijving die daar wél in staat is door
// Pinterest zelf afgekapt tot een korte preview, nooit het volledige
// recept. Het echte recept staat op de site waar de pin naar doorlinkt --
// die outbound-link zit als "link":"https://..." ergens in de pagina.
function extractPinterestOutboundLink(html: string): URL | null {
  const match = html.match(/"link":"((?:[^"\\]|\\.)*)"/);
  if (!match) return null;
  let raw: string;
  try {
    raw = JSON.parse(`"${match[1]}"`);
  } catch {
    return null;
  }
  try {
    const url = new URL(raw);
    if (UNHELPFUL_OUTBOUND_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

export async function fetchPageTextForExtraction(rawUrl: string): Promise<string> {
  const url = assertSafeImportUrl(rawUrl);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; WeekschemaRecipeImport/1.0)" },
    signal: AbortSignal.timeout(15000)
  }).catch(() => null);

  if (!res || !res.ok) {
    throw createError({ statusCode: 502, statusMessage: "Kon de pagina niet ophalen" });
  }

  const finalHost = new URL(res.url).hostname.toLowerCase();
  const html = await res.text();

  if (PINTEREST_HOSTS.has(finalHost)) {
    const outbound = extractPinterestOutboundLink(html);
    if (outbound) {
      try {
        const safeOutbound = assertSafeImportUrl(outbound.toString());
        const outboundHtml = await fetchHtml(safeOutbound);
        if (outboundHtml) {
          const extracted = extractRecipeJsonLd(outboundHtml) ?? stripHtmlToText(outboundHtml).slice(0, 8000);
          if (extracted.length > 200) return extracted;
        }
      } catch {
        // Outbound-link bleek zelf niet toegestaan (bv. interne/lokale URL)
        // -- gewoon terugvallen op Pinterest's eigen (beperktere) pagina.
      }
    }
  }

  return extractRecipeJsonLd(html) ?? stripHtmlToText(html).slice(0, 8000);
}

function extractRecipeJsonLd(html: string): string | null {
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of scripts) {
    let data: any;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const candidates: any[] = Array.isArray(data) ? data : Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];

    for (const item of candidates) {
      const types = Array.isArray(item?.["@type"]) ? item["@type"] : [item?.["@type"]];
      if (!types.includes("Recipe")) continue;

      const ingredients: string[] = Array.isArray(item.recipeIngredient) ? item.recipeIngredient : [];
      const instructionsRaw = item.recipeInstructions;
      const instructions: string = Array.isArray(instructionsRaw)
        ? instructionsRaw.map((s: any) => (typeof s === "string" ? s : (s?.text ?? ""))).join("\n")
        : typeof instructionsRaw === "string"
          ? instructionsRaw
          : "";

      return [
        `Naam: ${item.name ?? ""}`,
        `Aantal porties: ${item.recipeYield ?? ""}`,
        `Ingrediënten:\n${ingredients.join("\n")}`,
        `Bereiding:\n${instructions}`
      ].join("\n\n");
    }
  }

  return null;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
