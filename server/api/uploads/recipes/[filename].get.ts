import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../../utils/session";
import { db } from "../../../db";
import { recipes } from "../../../db/schema";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif"
};

// Bestandsnaam is altijd "<recipeId>-<timestamp>.<ext>" (zie
// recipes/[id]/image.post.ts) -- hieruit valideren we zowel het
// bestandstype als dat dit recept echt bij het huishouden van de
// ingelogde gebruiker hoort, vóórdat we iets van schijf lezen.
const FILENAME_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-\d+\.(jpg|jpeg|png|webp|gif)$/i;

export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const filename = getRouterParam(event, "filename") ?? "";

  const match = FILENAME_RE.exec(filename);
  if (!match) {
    throw createError({ statusCode: 400, statusMessage: "Ongeldige bestandsnaam" });
  }
  const [, recipeId, ext] = match;

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.householdId, householdId))
  });
  if (!recipe) {
    throw createError({ statusCode: 404, statusMessage: "Niet gevonden" });
  }

  const filePath = join(process.cwd(), "uploads", "recipes", filename);
  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    throw createError({ statusCode: 404, statusMessage: "Niet gevonden" });
  }

  setHeader(event, "Content-Type", MIME[ext.toLowerCase()]);
  setHeader(event, "Cache-Control", "private, max-age=31536000, immutable");
  return data;
});
