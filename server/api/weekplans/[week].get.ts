import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { weekPlans, mealSlots, weekDagen } from "../../db/schema";

// GET /api/weekplans/2026-09-01  (week param = the Monday of that week)
// Returns the week plan, creating it (and its 35 empty slots: 7 dagen x 5
// eetmomenten) on first visit to that week.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const week = getRouterParam(event, "week");

  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    throw createError({ statusCode: 400, statusMessage: "Ongeldige week (verwacht YYYY-MM-DD)" });
  }

  let plan = await db.query.weekPlans.findFirst({
    where: and(eq(weekPlans.householdId, householdId), eq(weekPlans.weekStart, week))
  });

  if (!plan) {
    const [created] = await db
      .insert(weekPlans)
      .values({ householdId, weekStart: week })
      .returning();
    plan = created;

    const moments = ["ontbijt", "tussendoor_1", "lunch", "tussendoor_2", "diner"] as const;
    await db.insert(mealSlots).values(
      weekDagen.flatMap((dag) =>
        moments.map((mealMoment) => ({ weekPlanId: plan!.id, dag, mealMoment }))
      )
    );
  }

  const slots = await db.query.mealSlots.findMany({
    where: eq(mealSlots.weekPlanId, plan.id),
    with: {
      recipe: { with: { ingredients: { with: { ingredient: true } } } }
    }
  });

  return { plan, slots };
});
