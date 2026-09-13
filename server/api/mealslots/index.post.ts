import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { mealSlots, weekPlans, type WeekDag, type MealMomentKey } from "../../db/schema";

interface Body {
  weekPlanId: string;
  dag: WeekDag;
  mealMoment: MealMomentKey;
  recipeId?: string | null; // null = slot leegmaken; weglaten = ongewijzigd laten
  notitie?: string | null;
  kokUserId?: string | null;
}

// Sets (or clears) which recipe sits in one day/meal-moment slot, en
// optioneel een notitie en/of wie het kookt. Slots always exist already
// (created up-front in weekplans/[week].get.ts), so this is always an
// update, keyed on the (weekPlanId, dag, mealMoment) unique constraint.
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
  if ("recipeId" in body) set.recipeId = body.recipeId;
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
