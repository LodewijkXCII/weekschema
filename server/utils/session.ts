import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "../db";
import { householdMembers } from "../db/schema";

// Resolves the logged-in user + their household for the current request.
// Throws a 401 if not logged in, and a 403 if logged in but not (yet) part
// of a household (see /api/household/create and /api/household/join).
export async function requireHousehold(event: any) {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Niet ingelogd" });
  }

  const membership = await db.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, session.user.id)
  });

  if (!membership) {
    throw createError({
      statusCode: 403,
      statusMessage: "Nog geen huishouden -- maak er een aan of gebruik een uitnodigingscode"
    });
  }

  return { session, householdId: membership.householdId };
}
