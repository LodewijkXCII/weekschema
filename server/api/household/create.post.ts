import { auth } from "../../utils/auth";
import { db } from "../../db";
import { households, householdMembers } from "../../db/schema";

const nanoid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// Creates a brand new household and makes the current user its first
// member. Used once by whichever partner signs up first.
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Niet ingelogd" });
  }

  const body = await readBody<{ naam: string }>(event);
  if (!body?.naam) {
    throw createError({ statusCode: 400, statusMessage: "Naam is verplicht" });
  }

  const [household] = await db
    .insert(households)
    .values({ naam: body.naam, inviteCode: nanoid() })
    .returning();

  await db.insert(householdMembers).values({
    householdId: household.id,
    userId: session.user.id
  });

  return household;
});
