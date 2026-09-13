// Zoekt producten + voedingswaarden op bij Albert Heijn, zodat je bij het
// toevoegen van een ingrediënt niet zelf kcal/eiwit/vet/koolhydraten hoeft
// op te zoeken en over te typen.
//
// Let op: dit gebruikt AH's *onofficiële*, niet-gedocumenteerde mobiele
// app-API (dezelfde die de Appie-app zelf gebruikt). Die kan zonder
// aankondiging wijzigen of stoppen met werken -- vandaar dat het
// ingrediënt-formulier de velden altijd ook gewoon handmatig laat invullen
// als fallback.
const AH_HEADERS = {
  "X-Application": "AHWEBSHOP",
  "User-Agent": "Appie/8.0 (iPhone; iOS 16.0; Scale/2.00)"
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch("https://api.ah.nl/mobile-auth/v1/auth/token/anonymous", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "appie" })
  });
  if (!res.ok) throw new Error(`AH-authenticatie mislukt (${res.status})`);
  const data = await res.json();

  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

function extractMacros(detail: any) {
  const header = detail?.tradeItem?.nutritionalInformation?.nutrientHeaders?.[0];
  if (!header) return null;
  // Alleen waarden "per 100 [eenheid]" vertrouwen we 1-op-1 als "per 100g" --
  // dat is verreweg de gangbare basis bij AH en scheelt herrekenen.
  if (header.nutrientBasisQuantity?.value !== 100) return null;

  const find = (code: string, unit?: string) =>
    header.nutrientDetail?.find(
      (n: any) =>
        n.nutrientTypeCode?.value === code &&
        (!unit || n.quantityContained?.[0]?.measurementUnitCode?.value === unit)
    )?.quantityContained?.[0]?.value;

  const kcal = find("ENER-", "kcal");
  const eiwit = find("PRO-");
  const vet = find("FAT");
  const koolhydraten = find("CHOAVL");

  if ([kcal, eiwit, vet, koolhydraten].some((v) => typeof v !== "number")) return null;

  return {
    kcalPer100g: kcal as number,
    eiwitPer100g: eiwit as number,
    vetPer100g: vet as number,
    koolhydratenPer100g: koolhydraten as number
  };
}

export interface AhProductMatch {
  id: number;
  naam: string;
  merk: string | null;
  inhoud: string | null;
  afbeeldingUrl: string | null;
  winkelCategorie: string | null;
  kcalPer100g: number;
  eiwitPer100g: number;
  vetPer100g: number;
  koolhydratenPer100g: number;
}

export async function searchAhProducts(query: string, limit = 8): Promise<AhProductMatch[]> {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, ...AH_HEADERS };

  const searchRes = await fetch(
    `https://api.ah.nl/mobile-services/product/search/v2?query=${encodeURIComponent(query)}&size=${limit}`,
    { headers }
  );
  if (!searchRes.ok) throw new Error(`AH-zoekopdracht mislukt (${searchRes.status})`);
  const searchData = await searchRes.json();
  const products: any[] = searchData.products ?? [];

  const results = await Promise.all(
    products.map(async (p): Promise<AhProductMatch | null> => {
      try {
        const detailRes = await fetch(
          `https://api.ah.nl/mobile-services/product/detail/v4/fir/${p.webshopId}`,
          { headers }
        );
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        const macros = extractMacros(detail);
        if (!macros) return null;

        return {
          id: p.webshopId,
          naam: p.title,
          merk: p.brand ?? null,
          inhoud: p.salesUnitSize ?? null,
          afbeeldingUrl: p.images?.find((i: any) => i.width === 200)?.url ?? p.images?.[0]?.url ?? null,
          winkelCategorie: p.mainCategory ?? null,
          ...macros
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is AhProductMatch => r !== null);
}
