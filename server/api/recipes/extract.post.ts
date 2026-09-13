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

  const ingredienten = extracted.ingredienten.map((ing) => {
    const naamNorm = norm(ing.naam);
    const match =
      householdIngredients.find((e) => norm(e.naam) === naamNorm) ??
      householdIngredients.find((e) => naamNorm.includes(norm(e.naam)) || norm(e.naam).includes(naamNorm));
    return {
      naam: ing.naam,
      hoeveelheidGram: Math.max(1, Math.round(ing.hoeveelheidGram)),
      ingredientId: match?.id ?? null
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
