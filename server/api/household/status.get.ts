import { eq } from "drizzle-orm";
import { auth } from "../../utils/auth";
import { db } from "../../db";
import { householdMembers } from "../../db/schema";

// GET /api/household/status -- is er een sessie, en zit die gebruiker al in
// een huishouden? Gooit bewust geen 401/403 (anders dan requireHousehold),
// zodat de auth-middleware hiermee kan bepalen waar een bezoeker heen moet.
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) return { loggedIn: false, hasHousehold: false };

  const membership = await db.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id)
  });

  return { loggedIn: true, hasHousehold: !!membership };
});
