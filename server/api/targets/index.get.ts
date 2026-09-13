import { eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { dailyTargets } from "../../db/schema";

// GET /api/targets -- alle doelprofielen van dit huishouden (bv.
// "Huishouden", "Kinderen"), elk met eigen dagelijkse macro-plafonds. Maakt
// een standaardprofiel aan bij het eerste bezoek zodat de frontend nooit een
// lege lijst hoeft af te handelen.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);

  const existing = await db.query.dailyTargets.findMany({
    where: eq(dailyTargets.householdId, householdId),
    orderBy: (t, { asc }) => asc(t.naam)
  });
  if (existing.length) return existing;

  const [created] = await db.insert(dailyTargets).values({ householdId }).returning();
  return [created];
});
