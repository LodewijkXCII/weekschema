import { eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { households } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  return db.query.households.findFirst({ where: eq(households.id, householdId) });
});
