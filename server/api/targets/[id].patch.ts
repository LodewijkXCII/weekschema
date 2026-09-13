import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { dailyTargets } from "../../db/schema";

interface Body {
  naam?: string;
  maxKcal?: number;
  maxEiwit?: number;
  maxVet?: number;
  maxKoolhydraten?: number;
}

// PATCH /api/targets/:id -- een bestaand doelprofiel bijwerken.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const id = getRouterParam(event, "id");
  const body = await readBody<Body>(event);

  const [row] = await db
    .update(dailyTargets)
    .set(body)
    .where(and(eq(dailyTargets.id, id!), eq(dailyTargets.householdId, householdId)))
    .returning();

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Doelprofiel niet gevonden" });
  }
  return row;
});
