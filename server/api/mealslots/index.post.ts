import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { mealSlots, weekPlans, ingredients, type WeekDag, type MealMomentKey } from "../../db/schema";
import { INGREDIENT_UNITS, eenheidNaarGram, type IngredientUnitKey } from "../../utils/ingredientUnits";

interface Body {
  weekPlanId: string;
  dag: WeekDag;
  mealMoment: MealMomentKey;
  recipeId?: string | null; // null = slot leegmaken; weglaten = ongewijzigd laten
  // Eén los ingrediënt i.p.v. een recept (bv. een handje noten als
  // tussendoortje). null = leegmaken; weglaten = ongewijzigd laten.
  ingredient?: { ingredientId: string; hoeveelheid: number; eenheid: IngredientUnitKey } | null;
  notitie?: string | null;
  kokUserId?: string | null;
}

// Sets (or clears) which recipe -- or single ingredient -- sits in one
// day/meal-moment slot, en optioneel een notitie en/of wie het kookt. Slots
// always exist already (created up-front in weekplans/[week].get.ts), so
// this is always an update, keyed on the (weekPlanId, dag, mealMoment)
// unique constraint.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const body = await readBody<Body>(event);

  // Verify the week plan actually belongs to this household before writing.
  const plan = await db.query.weekPlans.findFirst({
    where: and(eq(weekPlans.id, body.weekPlanId), eq(weekPlans.householdId, householdId))
  });
  if (!plan) {
    throw createError({ statusCode: 404, statusMessage: "Weekschema niet gevonden" });
  }

  const set: Record<string, unknown> = {};
  const clearIngredient = {
    ingredientId: null,
    ingredientHoeveelheid: null,
    ingredientEenheid: null,
    ingredientHoeveelheidGram: null
  };

  // Een vakje heeft óf een recept óf een los ingrediënt: het een zetten
  // maakt het ander altijd leeg.
  if ("recipeId" in body) {
    set.recipeId = body.recipeId;
    if (body.recipeId) Object.assign(set, clearIngredient);
  }
  if ("ingredient" in body) {
    if (!body.ingredient) {
      Object.assign(set, clearIngredient);
    } else {
      const { ingredientId, hoeveelheid, eenheid } = body.ingredient;
      if (!(hoeveelheid > 0) || !INGREDIENT_UNITS.some((u) => u.key === eenheid)) {
        throw createError({ statusCode: 400, statusMessage: "Ongeldige hoeveelheid of eenheid" });
      }
      const ingredient = await db.query.ingredients.findFirst({
        where: and(eq(ingredients.id, ingredientId), eq(ingredients.householdId, householdId))
      });
      if (!ingredient) {
        throw createError({ statusCode: 404, statusMessage: "Ingrediënt niet gevonden" });
      }
      let hoeveelheidGram: number;
      try {
        // Nooit door de client laten aanleveren -- zie CLAUDE.md.
        hoeveelheidGram = eenheidNaarGram(hoeveelheid, eenheid, ingredient.gramPerStuk);
      } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message });
      }
      Object.assign(set, {
        recipeId: null,
        ingredientId,
        ingredientHoeveelheid: hoeveelheid,
        ingredientEenheid: eenheid,
        ingredientHoeveelheidGram: hoeveelheidGram
      });
    }
  }
  if ("notitie" in body) set.notitie = body.notitie?.trim() || null;
  if ("kokUserId" in body) set.kokUserId = body.kokUserId || null;

  const [row] = await db
    .update(mealSlots)
    .set(set)
    .where(
      and(
        eq(mealSlots.weekPlanId, body.weekPlanId),
        eq(mealSlots.dag, body.dag),
        eq(mealSlots.mealMoment, body.mealMoment)
      )
    )
    .returning();

  return row;
});
