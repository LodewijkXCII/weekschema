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

export async function fetchPageTextForExtraction(rawUrl: string): Promise<string> {
  const url = assertSafeImportUrl(rawUrl);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; WeekschemaRecipeImport/1.0)" },
    signal: AbortSignal.timeout(15000)
  }).catch(() => null);

  if (!res || !res.ok) {
    throw createError({ statusCode: 502, statusMessage: "Kon de pagina niet ophalen" });
  }

  const html = await res.text();
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
