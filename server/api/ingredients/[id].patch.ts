import { and, eq, sql } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { ingredients, recipeIngredients } from "../../db/schema";

interface Body {
  naam?: string;
  kcalPer100g?: number;
  eiwitPer100g?: number;
  vetPer100g?: number;
  koolhydratenPer100g?: number;
  winkelCategorie?: string | null;
  basisvoorraad?: boolean;
  allergenen?: string[];
  gramPerStuk?: number | null;
}

// PATCH /api/ingredients/:id -- ingrediënt bewerken. Macro's worden altijd
// per 100g opgeslagen (zie CLAUDE.md), dus dit werkt automatisch door in
// elk recept dat dit ingrediënt gebruikt -- macro's worden nergens
// dubbel/statisch per recept bewaard, alleen live berekend. Uitzondering:
// hoeveelheidGram van recept-regels in "stuks" is bij het opslaan van het
// recept vastgelegd met het toenmalige gramPerStuk -- die worden hier
// herberekend als gramPerStuk wijzigt, anders blijven die recepten op het
// oude gewicht rekenen.
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const id = getRouterParam(event, "id");
  const body = await readBody<Body>(event);

  const set: Record<string, unknown> = {};
  if (typeof body.naam === "string" && body.naam.trim()) set.naam = body.naam.trim();
  if (typeof body.kcalPer100g === "number") set.kcalPer100g = body.kcalPer100g;
  if (typeof body.eiwitPer100g === "number") set.eiwitPer100g = body.eiwitPer100g;
  if (typeof body.vetPer100g === "number") set.vetPer100g = body.vetPer100g;
  if (typeof body.koolhydratenPer100g === "number") set.koolhydratenPer100g = body.koolhydratenPer100g;
  if (body.winkelCategorie !== undefined) set.winkelCategorie = body.winkelCategorie || null;
  if (typeof body.basisvoorraad === "boolean") set.basisvoorraad = body.basisvoorraad;
  if (Array.isArray(body.allergenen)) {
    set.allergenen = body.allergenen.filter((a) => a.trim()).map((a) => a.trim().toLowerCase());
  }
  if (body.gramPerStuk !== undefined) set.gramPerStuk = body.gramPerStuk || null;

  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(ingredients)
      .set(set)
      .where(and(eq(ingredients.id, id!), eq(ingredients.householdId, householdId)))
      .returning();

    // Zonder gramPerStuk valt er niets te herberekenen -- dan blijven de
    // bestaande grammen staan. Zelfde afronding als eenheidNaarGram().
    if (updated?.gramPerStuk) {
      await tx
        .update(recipeIngredients)
        .set({
          hoeveelheidGram: sql`round((${recipeIngredients.hoeveelheid} * ${updated.gramPerStuk} * 10)::numeric) / 10`
        })
        .where(and(eq(recipeIngredients.ingredientId, updated.id), eq(recipeIngredients.eenheid, "stuks")));
    }

    return updated;
  });

  if (!row) throw createError({ statusCode: 404, statusMessage: "Ingrediënt niet gevonden" });
  return row;
});
