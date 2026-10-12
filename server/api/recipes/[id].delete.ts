import { and, eq } from "drizzle-orm";
import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes } from "../../db/schema";

// DELETE /api/recipes/:id -- de database ruimt de rest zelf op via de
// foreign keys: recipe_ingredients en recipe_reactions cascaden mee, en
// vakjes op het weekbord met dit recept worden leeg (recipe_id -> null).
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const id = getRouterParam(event, "id");

  const [deleted] = await db
    .delete(recipes)
    .where(and(eq(recipes.id, id!), eq(recipes.householdId, householdId)))
    .returning({ id: recipes.id });
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "Recept niet gevonden" });
  }

  // Geüploade foto's heten `${recipeId}-${timestamp}.${ext}` (zie
  // image.post.ts); ook eerder vervangen foto's staan daar nog. Best-effort:
  // een achtergebleven bestand is geen reden om het verwijderen te laten falen.
  const dir = join(process.cwd(), "uploads", "recipes");
  try {
    const files = await readdir(dir);
    await Promise.all(files.filter((f) => f.startsWith(`${deleted.id}-`)).map((f) => unlink(join(dir, f)).catch(() => {})));
  } catch {
    // map bestaat (nog) niet
  }

  return { ok: true };
});
