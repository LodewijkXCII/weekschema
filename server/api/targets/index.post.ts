import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { dailyTargets } from "../../db/schema";

interface Body {
  naam: string;
  maxKcal: number;
  maxEiwit: number;
  maxVet: number;
  maxKoolhydraten: number;
}

// POST /api/targets -- een nieuw doelprofiel aanmaken (bv. "Kinderen"
// naast het bestaande "Huishouden"-profiel).
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const body = await readBody<Body>(event);

  if (!body?.naam?.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Naam is verplicht" });
  }

  const [row] = await db
    .insert(dailyTargets)
    .values({
      householdId,
      naam: body.naam.trim(),
      maxKcal: body.maxKcal,
      maxEiwit: body.maxEiwit,
      maxVet: body.maxVet,
      maxKoolhydraten: body.maxKoolhydraten
    })
    .returning();

  return row;
});
