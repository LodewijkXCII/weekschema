import { eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { householdMembers } from "../../db/schema";
import { user } from "../../db/auth-schema";

// GET /api/household/members -- de gebruikers in dit huishouden, voor bv.
// "wie kookt vandaag"-toewijzing.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);

  const rows = await db
    .select({ userId: user.id, naam: user.name })
    .from(householdMembers)
    .innerJoin(user, eq(householdMembers.userId, user.id))
    .where(eq(householdMembers.householdId, householdId));

  return rows;
});
