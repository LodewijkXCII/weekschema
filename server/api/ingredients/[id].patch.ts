import { and, eq } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { ingredients } from "../../db/schema";

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
// dubbel/statisch per recept bewaard, alleen live berekend.
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

  const [row] = await db
    .update(ingredients)
    .set(set)
    .where(and(eq(ingredients.id, id!), eq(ingredients.householdId, householdId)))
    .returning();

  if (!row) throw createError({ statusCode: 404, statusMessage: "Ingrediënt niet gevonden" });
  return row;
});
