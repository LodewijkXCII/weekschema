import { eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { ingredients } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  return db.query.ingredients.findMany({
    where: eq(ingredients.householdId, householdId),
    orderBy: (i, { asc }) => asc(i.naam)
  });
});
