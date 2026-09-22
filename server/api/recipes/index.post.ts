import { and, eq, inArray } from "drizzle-orm";
import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes, recipeIngredients, ingredients, recipeCategorieen, type RecipeCategorie } from "../../db/schema";
import { eenheidNaarGram, type IngredientUnitKey } from "../../utils/ingredientUnits";

interface Body {
  naam: string;
  categorie: RecipeCategorie;
  bereiding?: string;
  porties: number;
  favoriet?: boolean;
  tags?: string[];
  ingredienten: { ingredientId: string; hoeveelheid: number; eenheid: IngredientUnitKey }[];
}

export default defineEventHandler(async (event) => {
  const { householdId, session } = await requireHousehold(event);
  const body = await readBody<Body>(event);

  if (!body?.naam || !body?.ingredienten?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Naam en minstens 1 ingrediënt zijn verplicht"
    });
  }

  if (!recipeCategorieen.includes(body.categorie)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Categorie moet een van de volgende zijn: ${recipeCategorieen.join(", ")}`
    });
  }

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

  let ingredientenMetGram: { ingredientId: string; hoeveelheid: number; eenheid: IngredientUnitKey; hoeveelheidGram: number }[];
  try {
    ingredientenMetGram = body.ingredienten.map((i) => ({
      ingredientId: i.ingredientId,
      hoeveelheid: i.hoeveelheid,
      eenheid: i.eenheid,
      // Nooit een door de client aangeleverde hoeveelheidGram vertrouwen --
      // altijd zelf herberekend uit hoeveelheid+eenheid (en, voor "stuks",
      // het gramPerStuk van het ingrediënt zelf), dat blijft de enige bron
      // van waarheid voor macro-berekeningen.
      hoeveelheidGram: eenheidNaarGram(i.hoeveelheid, i.eenheid, gramPerStukPerId.get(i.ingredientId))
    }));
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message });
  }

  const recipe = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(recipes)
      .values({
        householdId,
        naam: body.naam,
        categorie: body.categorie,
        bereiding: body.bereiding ?? null,
        porties: body.porties || 1,
        favoriet: body.favoriet ?? false,
        tags: body.tags?.filter((t) => t.trim()).map((t) => t.trim().toLowerCase()) ?? null,
        createdByUserId: session.user.id
      })
      .returning();

    await tx.insert(recipeIngredients).values(
      ingredientenMetGram.map((i) => ({ ...i, recipeId: row.id }))
    );

    return row;
  });

  return recipe;
});
