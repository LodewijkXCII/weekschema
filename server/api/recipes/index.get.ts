import { eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes } from "../../db/schema";
import { hydrateSubRecipes } from "../../utils/recipeIngredients";
import { recipeTotals } from "../../utils/recipeTree";

// Returns recipes with their ingredients (and each ingredient's macros)
// nested (sub-recipes as `ri.subRecipe`, see recipeTree.ts), plus the
// recipe's total and per-serving macros pre-computed --
// the week board and recipe list both just read these numbers directly.
// Ook duimpje-omhoog/omlaag-tellingen en de eigen reactie van de ingelogde
// gebruiker worden meegestuurd.
export default defineEventHandler(async (event) => {
  const { householdId, session } = await requireHousehold(event);

  const rows = await db.query.recipes.findMany({
    where: eq(recipes.householdId, householdId),
    orderBy: (r, { asc }) => asc(r.naam),
    with: {
      ingredients: { with: { ingredient: true } },
      reactions: true
    }
  });

  await hydrateSubRecipes(rows, householdId, rows);

  return rows.map((r) => {
    const totals = recipeTotals(r);

    const perPortie = {
      kcal: totals.kcal / r.porties,
      eiwit: totals.eiwit / r.porties,
      vet: totals.vet / r.porties,
      kh: totals.kh / r.porties
    };

    const duimpjesOmhoog = r.reactions.filter((x) => x.waarde > 0).length;
    const duimpjesOmlaag = r.reactions.filter((x) => x.waarde < 0).length;
    const mijnReactie = r.reactions.find((x) => x.userId === session.user.id)?.waarde ?? 0;

    const { reactions, ...rest } = r;
    return { ...rest, totals, perPortie, duimpjesOmhoog, duimpjesOmlaag, mijnReactie };
  });
});
