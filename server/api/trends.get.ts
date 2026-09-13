import { and, eq, gte } from "drizzle-orm";
import { requireHousehold } from "../utils/session";
import { db } from "../db";
import { weekPlans, weekDagen } from "../db/schema";

// GET /api/trends?weken=8
// Geeft per dag de opgetelde macro's terug over de laatste N weken, voor een
// trendgrafiek. Alleen dagen met minstens 1 ingevuld vakje worden
// meegenomen (lege/toekomstige dagen zouden de trend anders vertekenen).
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const query = getQuery(event);
  const weken = Math.min(52, Math.max(1, Number(query.weken) || 8));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weken * 7);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const plans = await db.query.weekPlans.findMany({
    where: and(eq(weekPlans.householdId, householdId), gte(weekPlans.weekStart, cutoffIso)),
    with: {
      slots: {
        with: {
          recipe: { with: { ingredients: { with: { ingredient: true } } } }
        }
      }
    }
  });

  const dagen: { datum: string; kcal: number; eiwit: number; vet: number; kh: number }[] = [];

  for (const plan of plans) {
    const weekStart = new Date(plan.weekStart + "T00:00:00");
    for (let i = 0; i < weekDagen.length; i++) {
      const dag = weekDagen[i];
      const totals = { kcal: 0, eiwit: 0, vet: 0, kh: 0 };
      for (const slot of plan.slots) {
        if (slot.dag !== dag || !slot.recipe) continue;
        const factor = 1 / slot.recipe.porties;
        for (const ri of slot.recipe.ingredients) {
          const g = ri.hoeveelheidGram * factor;
          totals.kcal += (ri.ingredient.kcalPer100g * g) / 100;
          totals.eiwit += (ri.ingredient.eiwitPer100g * g) / 100;
          totals.vet += (ri.ingredient.vetPer100g * g) / 100;
          totals.kh += (ri.ingredient.koolhydratenPer100g * g) / 100;
        }
      }
      if (totals.kcal === 0) continue;

      const datum = new Date(weekStart);
      datum.setDate(datum.getDate() + i);
      dagen.push({ datum: datum.toISOString().slice(0, 10), ...totals });
    }
  }

  dagen.sort((a, b) => a.datum.localeCompare(b.datum));
  return dagen;
});
