import type { IngredientUnitKey } from "./useIngredientUnits";
import type { RecipeCategorie } from "./useMealMoments";

export interface RecipeFormRow {
  ingredientId: string;
  hoeveelheid: number;
  eenheid: IngredientUnitKey;
  // Alleen gezet na een import, voor ingrediënten die niet automatisch
  // gekoppeld konden worden.
  _importNaam?: string | null;
  _suggestieId?: string | null;
  _suggestieNaam?: string | null;
}

export interface RecipeFormState {
  naam: string;
  categorie: RecipeCategorie;
  porties: number;
  bereiding: string;
  // Komma-gescheiden invoer; wordt pas bij opslaan een array.
  tags: string;
  favoriet: boolean;
  photo: File | null;
  rows: RecipeFormRow[];
}

export function emptyRecipeRow(): RecipeFormRow {
  return { ingredientId: "", hoeveelheid: 100, eenheid: "gram" };
}

export function emptyRecipeForm(): RecipeFormState {
  return {
    naam: "",
    categorie: "diner",
    porties: 1,
    bereiding: "",
    tags: "",
    favoriet: false,
    photo: null,
    rows: [emptyRecipeRow()]
  };
}

export function recipeFormFrom(recipe: any): RecipeFormState {
  return {
    naam: recipe.naam,
    categorie: recipe.categorie,
    porties: recipe.porties,
    bereiding: recipe.bereiding ?? "",
    tags: (recipe.tags ?? []).join(", "),
    favoriet: recipe.favoriet,
    photo: null,
    rows: recipe.ingredients.map((ri: any) => ({
      ingredientId: ri.ingredientId,
      // Oudere recepten (van vóór dit veld bestond) hebben geen hoeveelheid/
      // eenheid opgeslagen -- val dan terug op de grammen die er al waren.
      hoeveelheid: ri.hoeveelheid ?? ri.hoeveelheidGram,
      eenheid: (ri.eenheid ?? "gram") as IngredientUnitKey
    }))
  };
}

export function recipePayload(form: RecipeFormState) {
  return {
    naam: form.naam,
    categorie: form.categorie,
    porties: form.porties,
    bereiding: form.bereiding,
    favoriet: form.favoriet,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    ingredienten: form.rows.map((r) => ({
      ingredientId: r.ingredientId,
      hoeveelheid: r.hoeveelheid,
      eenheid: r.eenheid
    }))
  };
}

export async function uploadRecipePhoto(recipeId: string, photo: File) {
  const body = new FormData();
  body.append("file", photo);
  await $fetch(`/api/recipes/${recipeId}/image`, { method: "POST", body });
}
