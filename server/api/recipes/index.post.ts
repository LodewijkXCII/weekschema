import { requireHousehold } from "../../utils/session";
import { db } from "../../db";
import { recipes, recipeIngredients, recipeCategorieen, type RecipeCategorie } from "../../db/schema";

interface Body {
  naam: string;
  categorie: RecipeCategorie;
  bereiding?: string;
  porties: number;
  favoriet?: boolean;
  tags?: string[];
  ingredienten: { ingredientId: string; hoeveelheidGram: number }[];
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
      body.ingredienten.map((i) => ({
        recipeId: row.id,
        ingredientId: i.ingredientId,
        hoeveelheidGram: i.hoeveelheidGram
      }))
    );

    return row;
  });

  return recipe;
});
