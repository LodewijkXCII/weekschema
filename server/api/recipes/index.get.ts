import { eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes } from "../../db/schema";

// Returns recipes with their ingredients (and each ingredient's macros)
// nested, plus the recipe's total and per-serving macros pre-computed --
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

  return rows.map((r) => {
    const totals = r.ingredients.reduce(
      (acc, ri) => {
        const factor = ri.hoeveelheidGram / 100;
        acc.kcal += ri.ingredient.kcalPer100g * factor;
        acc.eiwit += ri.ingredient.eiwitPer100g * factor;
        acc.vet += ri.ingredient.vetPer100g * factor;
        acc.kh += ri.ingredient.koolhydratenPer100g * factor;
        return acc;
      },
      { kcal: 0, eiwit: 0, vet: 0, kh: 0 }
    );

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
