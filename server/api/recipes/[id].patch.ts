import { and, eq, inArray } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes, recipeIngredients, ingredients, recipeCategorieen, type RecipeCategorie } from "../../db/schema";
import { eenheidNaarGram, type IngredientUnitKey } from "../../utils/ingredientUnits";

interface Body {
  naam?: string;
  categorie?: RecipeCategorie;
  bereiding?: string | null;
  porties?: number;
  favoriet?: boolean;
  tags?: string[];
  ingredienten?: { ingredientId: string; hoeveelheid: number; eenheid: IngredientUnitKey }[];
}

// PATCH /api/recipes/:id -- zowel lichte veld-updates (favoriet-toggle
// vanuit RecipeDetail) als een volledige bewerking (naam/categorie/
// porties/bereiding/tags/ingrediënten vanuit de edit-pagina). Alleen
// meegegeven velden worden gewijzigd; `ingredienten`, indien meegegeven,
// vervangt de hele ingrediëntenlijst (simpeler en minder foutgevoelig dan
// los toevoegen/verwijderen/bijwerken diffen).
export default defineEventHandler(async (event) => {
  const { householdId } = await requireHousehold(event);
  const id = getRouterParam(event, "id");
  const body = await readBody<Body>(event);

  if (body.categorie !== undefined && !recipeCategorieen.includes(body.categorie)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Categorie moet een van de volgende zijn: ${recipeCategorieen.join(", ")}`
    });
  }
  if (body.ingredienten !== undefined && body.ingredienten.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Minstens 1 ingrediënt is verplicht" });
  }

  const set: Record<string, unknown> = {};
  if (typeof body.naam === "string" && body.naam.trim()) set.naam = body.naam.trim();
  if (body.categorie !== undefined) set.categorie = body.categorie;
  if (body.bereiding !== undefined) set.bereiding = body.bereiding;
  if (body.porties !== undefined) set.porties = body.porties || 1;
  if (typeof body.favoriet === "boolean") set.favoriet = body.favoriet;
  if (Array.isArray(body.tags)) {
    set.tags = body.tags.filter((t) => t.trim()).map((t) => t.trim().toLowerCase());
  }

  let ingredientenMetGram:
    | { ingredientId: string; hoeveelheid: number; eenheid: IngredientUnitKey; hoeveelheidGram: number }[]
    | null = null;

  if (body.ingredienten) {
    // Ingrediënten van dit huishouden opzoeken -- zowel om gramPerStuk te
    // vinden (nodig voor de eenheid "stuks") als om te garanderen dat elk
    // ingredientId echt bij dit huishouden hoort.
    const ingredientIds = [...new Set(body.ingredienten.map((i) => i.ingredientId))];
    const gebruikteIngredienten = await db.query.ingredients.findMany({
      where: and(eq(ingredients.householdId, householdId), inArray(ingredients.id, ingredientIds))
    });
    if (gebruikteIngredienten.length !== ingredientIds.length) {
      throw createError({ statusCode: 400, statusMessage: "Eén of meer ingrediënten zijn niet gevonden" });
    }
    const gramPerStukPerId = new Map(gebruikteIngredienten.map((i) => [i.id, i.gramPerStuk]));

    try {
      ingredientenMetGram = body.ingredienten.map((i) => ({
        ingredientId: i.ingredientId,
        hoeveelheid: i.hoeveelheid,
        eenheid: i.eenheid,
        hoeveelheidGram: eenheidNaarGram(i.hoeveelheid, i.eenheid, gramPerStukPerId.get(i.ingredientId))
      }));
    } catch (e: any) {
      throw createError({ statusCode: 400, statusMessage: e.message });
    }
  }

  const row = await db.transaction(async (tx) => {
    // Drizzle's .set({}) gooit "No values to set" -- als er alleen
    // ingredienten worden bijgewerkt is `set` leeg, dus dan het bestaande
    // recept ophalen i.p.v. een lege update proberen.
    const updated =
      Object.keys(set).length > 0
        ? (
            await tx
              .update(recipes)
              .set(set)
              .where(and(eq(recipes.id, id!), eq(recipes.householdId, householdId)))
              .returning()
          )[0]
        : await tx.query.recipes.findFirst({
            where: and(eq(recipes.id, id!), eq(recipes.householdId, householdId))
          });

    if (!updated) return null;

    if (ingredientenMetGram) {
      await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, updated.id));
      await tx.insert(recipeIngredients).values(
        ingredientenMetGram.map((i) => ({ ...i, recipeId: updated.id }))
      );
    }

    return updated;
  });

  if (!row) throw createError({ statusCode: 404, statusMessage: "Recept niet gevonden" });
  return row;
});
