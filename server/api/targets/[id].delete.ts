import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { dailyTargets } from "../../db/schema";

// DELETE /api/targets/:id -- een doelprofiel verwijderen. Er moet altijd
// minstens 1 profiel overblijven.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const id = getRouterParam(event, "id");

  const existing = await db.query.dailyTargets.findMany({
    where: eq(dailyTargets.householdId, householdId)
  });
  if (existing.length <= 1) {
    throw createError({ statusCode: 400, statusMessage: "Je moet minstens 1 doelprofiel overhouden" });
  }

  await db
    .delete(dailyTargets)
    .where(and(eq(dailyTargets.id, id!), eq(dailyTargets.householdId, householdId)));

  return { success: true };
});
