import { eq } from "drizzle-orm";
import { auth } from "../../utils/auth";
import { db } from "../../db";
import { households, householdMembers } from "../../db/schema";

// Joins an existing household using the invite code shown on the other
// partner's settings page.
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Niet ingelogd" });
  }

  const body = await readBody<{ inviteCode: string }>(event);
  const household = await db.query.households.findFirst({
    where: eq(households.inviteCode, body?.inviteCode?.trim().toUpperCase() ?? "")
  });

  if (!household) {
    throw createError({ statusCode: 404, statusMessage: "Onbekende uitnodigingscode" });
  }

  await db
    .insert(householdMembers)
    .values({ householdId: household.id, userId: session.user.id })
    .onConflictDoNothing();

  return household;
});
