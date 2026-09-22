export interface IngredientFormState {
  naam: string;
  kcalPer100g: number | null;
  eiwitPer100g: number | null;
  vetPer100g: number | null;
  koolhydratenPer100g: number | null;
  winkelCategorie: string;
  gramPerStuk: number | null;
  basisvoorraad: boolean;
  // Komma-gescheiden invoer; wordt pas bij opslaan een array.
  allergenen: string;
}

export function emptyIngredientForm(naam = ""): IngredientFormState {
  return {
    naam,
    kcalPer100g: null,
    eiwitPer100g: null,
    vetPer100g: null,
    koolhydratenPer100g: null,
    winkelCategorie: "",
    gramPerStuk: null,
    basisvoorraad: false,
    allergenen: ""
  };
}

export function ingredientFormFrom(ing: any): IngredientFormState {
  return {
    naam: ing.naam,
    kcalPer100g: ing.kcalPer100g,
    eiwitPer100g: ing.eiwitPer100g,
    vetPer100g: ing.vetPer100g,
    koolhydratenPer100g: ing.koolhydratenPer100g,
    winkelCategorie: ing.winkelCategorie ?? "",
    gramPerStuk: ing.gramPerStuk ?? null,
    basisvoorraad: ing.basisvoorraad ?? false,
    allergenen: (ing.allergenen ?? []).join(", ")
  };
}

// Neemt naam + macro's over van een AH/NEVO-zoekresultaat.
export function applySearchResult(form: IngredientFormState, p: any) {
  form.naam = p.naam;
  form.kcalPer100g = p.kcalPer100g;
  form.eiwitPer100g = p.eiwitPer100g;
  form.vetPer100g = p.vetPer100g;
  form.koolhydratenPer100g = p.koolhydratenPer100g;
  form.winkelCategorie = p.winkelCategorie ?? "";
}

export function ingredientPayload(form: IngredientFormState) {
  return {
    ...form,
    allergenen: form.allergenen.split(",").map((a) => a.trim()).filter(Boolean)
  };
}
