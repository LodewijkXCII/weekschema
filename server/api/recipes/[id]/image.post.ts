import { and, eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireHousehold } from "../../../utils/session";
import { db } from "../../../db";
import { recipes } from "../../../db/schema";

// Alleen deze mime-types worden geaccepteerd; de extensie voor het
// opgeslagen bestand komt uit deze vaste lijst (nooit uit de door de
// gebruiker aangeleverde bestandsnaam) om padmanipulatie te voorkomen.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_BYTES = 5 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const id = getRouterParam(event, "id");

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, id!), eq(recipes.householdId, householdId))
  });
  if (!recipe) {
    throw createError({ statusCode: 404, statusMessage: "Recept niet gevonden" });
  }

  const parts = await readMultipartFormData(event);
  const file = parts?.find((p) => p.name === "file" && p.data?.length);
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: "Geen foto ontvangen" });
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: "Foto is te groot (max 5MB)" });
  }
  const ext = ALLOWED_TYPES[file.type ?? ""];
  if (!ext) {
    throw createError({
      statusCode: 400,
      statusMessage: "Alleen JPEG, PNG, WEBP of GIF-afbeeldingen zijn toegestaan"
    });
  }

  // Bewust buiten public/ -- Nuxt's dev-server bouwt de lijst van
  // statische public/-bestanden maar 1x op bij het opstarten, waardoor
  // nieuw geüploade foto's pas na een herstart zichtbaar zouden zijn.
  // In plaats daarvan worden foto's dynamisch uitgeserveerd via
  // GET /api/uploads/recipes/[filename], die live van schijf leest.
  const dir = join(process.cwd(), "uploads", "recipes");
  await mkdir(dir, { recursive: true });
  const filename = `${recipe.id}-${Date.now()}.${ext}`;
  await writeFile(join(dir, filename), file.data);

  const afbeeldingUrl = `/api/uploads/recipes/${filename}`;
  const [updated] = await db
    .update(recipes)
    .set({ afbeeldingUrl })
    .where(eq(recipes.id, recipe.id))
    .returning();

  return updated;
});
