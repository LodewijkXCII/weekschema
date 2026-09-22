import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { ingredients } from "../../db/schema";

interface Body {
  naam: string;
  kcalPer100g: number;
  eiwitPer100g: number;
  vetPer100g: number;
  koolhydratenPer100g: number;
  winkelCategorie?: string | null;
  basisvoorraad?: boolean;
  allergenen?: string[];
  gramPerStuk?: number | null;
}

export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const body = await readBody<Body>(event);

  if (!body?.naam) {
    throw createError({ statusCode: 400, statusMessage: "Naam is verplicht" });
  }

  const [row] = await db
    .insert(ingredients)
    .values({
      householdId,
      naam: body.naam,
      kcalPer100g: body.kcalPer100g ?? 0,
      eiwitPer100g: body.eiwitPer100g ?? 0,
      vetPer100g: body.vetPer100g ?? 0,
      koolhydratenPer100g: body.koolhydratenPer100g ?? 0,
      winkelCategorie: body.winkelCategorie ?? null,
      basisvoorraad: body.basisvoorraad ?? false,
      allergenen: body.allergenen?.filter((a) => a.trim()).map((a) => a.trim().toLowerCase()) ?? null,
      gramPerStuk: body.gramPerStuk || null
    })
    .returning();

  return row;
});
