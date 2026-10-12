import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes, recipeIngredients, recipeCategorieen, type RecipeCategorie } from "../../db/schema";
import { resolveRecipeIngredientRows, type RecipeIngredientInput } from "../../utils/recipeIngredients";

interface Body {
  naam: string;
  categorie: RecipeCategorie;
  bereiding?: string;
  porties: number;
  favoriet?: boolean;
  tags?: string[];
  ingredienten: RecipeIngredientInput[];
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

  const ingredientenMetGram = await resolveRecipeIngredientRows(householdId, body.ingredienten);

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
