import { eq } from "drizzle-orm";
import { auth } from "../../utils/auth";
import { db } from "../../db";
import { households, householdMembers } from "../../db/schema";

// Joins an existing household using the invite code shown on the other
// partner's settings page. Kan ook later (via /huishouden), bv. als de code
// bij het registreren fout was. Een gebruiker zit altijd in hooguit één
// huishouden: een eventueel eerder lidmaatschap wordt vervangen (het oude
// huishouden en zijn data blijven gewoon bestaan).
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

  await db.transaction(async (tx) => {
    await tx.delete(householdMembers).where(eq(householdMembers.userId, session.user.id));
    await tx.insert(householdMembers).values({ householdId: household.id, userId: session.user.id });
  });

  return household;
});
