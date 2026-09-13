import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes } from "../../db/schema";

interface Body {
  favoriet?: boolean;
  tags?: string[];
}

// PATCH /api/recipes/:id -- lichte veld-updates (favoriet-toggle, tags)
// zonder het hele recept opnieuw te hoeven opslaan.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const id = getRouterParam(event, "id");
  const body = await readBody<Body>(event);

  const set: Record<string, unknown> = {};
  if (typeof body.favoriet === "boolean") set.favoriet = body.favoriet;
  if (Array.isArray(body.tags)) {
    set.tags = body.tags.filter((t) => t.trim()).map((t) => t.trim().toLowerCase());
  }

  const [row] = await db
    .update(recipes)
    .set(set)
    .where(and(eq(recipes.id, id!), eq(recipes.householdId, householdId)))
    .returning();

  if (!row) throw createError({ statusCode: 404, statusMessage: "Recept niet gevonden" });
  return row;
});
