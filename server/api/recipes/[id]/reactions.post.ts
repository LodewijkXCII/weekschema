import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../../utils/session";
import { db } from "../../../db";
import { recipes, recipeReactions } from "../../../db/schema";

interface Body {
  // 1 = duim omhoog, -1 = duim omlaag, 0 = reactie intrekken
  waarde: -1 | 0 | 1;
}

// POST /api/recipes/:id/reactions -- eigen duim omhoog/omlaag zetten (of
// intrekken met waarde 0). Eén reactie per gebruiker per recept.
export default defineEventHandler(async (event) => {
  const { householdId, session } = await requireHousehold(event);
  const id = getRouterParam(event, "id");
  const body = await readBody<Body>(event);

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, id!), eq(recipes.householdId, householdId))
  });
  if (!recipe) throw createError({ statusCode: 404, statusMessage: "Recept niet gevonden" });

  if (body.waarde === 0) {
    await db
      .delete(recipeReactions)
      .where(and(eq(recipeReactions.recipeId, id!), eq(recipeReactions.userId, session.user.id)));
  } else {
    await db
      .insert(recipeReactions)
      .values({ recipeId: id!, userId: session.user.id, waarde: body.waarde })
      .onConflictDoUpdate({
        target: [recipeReactions.recipeId, recipeReactions.userId],
        set: { waarde: body.waarde }
      });
  }

  const reactions = await db.query.recipeReactions.findMany({
    where: eq(recipeReactions.recipeId, id!)
  });

  return {
    duimpjesOmhoog: reactions.filter((r) => r.waarde > 0).length,
    duimpjesOmlaag: reactions.filter((r) => r.waarde < 0).length,
    mijnReactie: body.waarde
  };
});
