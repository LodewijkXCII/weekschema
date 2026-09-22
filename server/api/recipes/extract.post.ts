import { eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { ingredients } from "../../db/schema";
import { extractRecipeFromImage, extractRecipeFromText } from "../../utils/claude";
import { fetchPageTextForExtraction } from "../../utils/recipeImport";

const ALLOWED_IMAGE_TYPES: Record<string, true> = {
  "image/jpeg": true,
  "image/png": true,
  "image/webp": true,
  "image/gif": true
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Rondt af op een hoeveelheid die je ook echt zo zou afwegen/kopen -- een
// AI-omrekening van bv. "2 pounds" komt op 908g uit, maar niemand haalt
// exact 908g bij de winkel; dat wordt dan 900g. De afrondstap schaalt mee
// met de grootte: bij kleine hoeveelheden (kruiden, snufjes) blijft elke
// gram ertoe doen, bij grotere hoeveelheden mag het grover.
function afrondenOpVriendelijkGetal(grammen: number): number {
  const stap = grammen < 10 ? 1 : grammen < 50 ? 5 : grammen < 200 ? 10 : grammen < 1000 ? 25 : 50;
  return Math.max(1, Math.round(grammen / stap) * stap);
}

// POST /api/recipes/extract -- haalt een recept-concept uit een URL, geplakte
// tekst, of een foto (multipart), en matcht de gevonden ingrediënten alvast
// tegen de bestaande ingrediëntenbibliotheek van dit huishouden.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const contentType = getHeader(event, "content-type") ?? "";

  const extracted = contentType.includes("multipart/form-data")
    ? await extractFromUpload(event)
    : await extractFromBody(event);

  const householdIngredients = await db.query.ingredients.findMany({
    where: eq(ingredients.householdId, householdId)
  });
  const norm = (s: string) => s.toLowerCase().trim();
  const eersteWoord = (s: string) => norm(s).split(/[\s,-]+/)[0] ?? "";

  const ingredienten = extracted.ingredienten.map((ing) => {
    const naamNorm = norm(ing.naam);
    // Alleen een écht exacte naam wordt automatisch gekoppeld. Een
    // bevat-relatie (bv. "sweet soy sauce" bevat "soy sauce" als complete
    // woorden) betekent niet betrouwbaar hetzelfde product met dezelfde
    // macro's -- dat werd hiervoor ten onrechte alsnog automatisch
    // gekoppeld, waardoor twee verschillende ingrediënten uit hetzelfde
    // recept stilzwijgend aan één bestaand ingrediënt vastzaten.
    const match = householdIngredients.find((e) => norm(e.naam) === naamNorm);

    // Geen exacte match, maar wel een bevat-relatie of hetzelfde eerste
    // woord (bv. "Sojasaus zoet" vs. een bestaande "Sojasaus donker") --
    // dat kán hetzelfde product zijn, maar kan ook net andere macro's
    // hebben, dus dit wordt een keuze-suggestie i.p.v. automatisch
    // samengevoegd.
    const suggestie = match
      ? null
      : (householdIngredients.find((e) => {
          const eNorm = norm(e.naam);
          return naamNorm.includes(eNorm) || eNorm.includes(naamNorm);
        }) ??
        householdIngredients.find((e) => eersteWoord(e.naam) === eersteWoord(ing.naam) && eersteWoord(e.naam)) ??
        null);

    return {
      naam: ing.naam,
      hoeveelheidGram: afrondenOpVriendelijkGetal(ing.hoeveelheidGram),
      ingredientId: match?.id ?? null,
      suggestieId: suggestie?.id ?? null,
      suggestieNaam: suggestie?.naam ?? null
    };
  });

  return { ...extracted, ingredienten };
});

async function extractFromBody(event: any) {
  const body = await readBody<{ url?: string; text?: string }>(event);

  if (body?.url?.trim()) {
    const pageText = await fetchPageTextForExtraction(body.url.trim());
    return extractRecipeFromText(pageText);
  }
  if (body?.text?.trim()) {
    return extractRecipeFromText(body.text.trim());
  }
  throw createError({ statusCode: 400, statusMessage: "Geef een URL of tekst op" });
}

async function extractFromUpload(event: any) {
  const parts = await readMultipartFormData(event);
  const file = parts?.find((p) => p.name === "file" && p.data?.length);
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: "Geen foto ontvangen" });
  }
  if (file.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: "Foto is te groot (max 8MB)" });
  }
  if (!file.type || !ALLOWED_IMAGE_TYPES[file.type]) {
    throw createError({ statusCode: 400, statusMessage: "Alleen JPEG, PNG, WEBP of GIF-afbeeldingen zijn toegestaan" });
  }

  return extractRecipeFromImage(file.data.toString("base64"), file.type as any);
}
