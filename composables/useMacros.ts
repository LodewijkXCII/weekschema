export interface Macros {
  kcal: number;
  eiwit: number;
  vet: number;
  kh: number;
}

export function emptyMacros(): Macros {
  return { kcal: 0, eiwit: 0, vet: 0, kh: 0 };
}

// Macro's per portie uit de rauwe ingrediënten van een recept. De weekplan-API
// levert geen voorberekende perPortie mee (alleen de recepten-lijst-API doet
// dat), dus weekbord, kiosk en detailpaneel rekenen het hiermee zelf uit.
export function recipePerPortie(recipe: any): Macros {
  const totals = emptyMacros();
  for (const ri of recipe?.ingredients ?? []) {
    const factor = ri.hoeveelheidGram / 100;
    totals.kcal += ri.ingredient.kcalPer100g * factor;
    totals.eiwit += ri.ingredient.eiwitPer100g * factor;
    totals.vet += ri.ingredient.vetPer100g * factor;
    totals.kh += ri.ingredient.koolhydratenPer100g * factor;
  }
  const porties = recipe?.porties || 1;
  return { kcal: totals.kcal / porties, eiwit: totals.eiwit / porties, vet: totals.vet / porties, kh: totals.kh / porties };
}

// Macro's voor een los ingrediënt van `gram` gram.
export function ingredientMacros(ingredient: any, gram: number): Macros {
  const factor = gram / 100;
  return {
    kcal: ingredient.kcalPer100g * factor,
    eiwit: ingredient.eiwitPer100g * factor,
    vet: ingredient.vetPer100g * factor,
    kh: ingredient.koolhydratenPer100g * factor
  };
}

// Een weekbord-vakje bevat óf een recept (1 portie) óf één los ingrediënt
// (bv. een handje noten) -- dit geeft in beide gevallen de macro's.
export function slotMacros(slot: any): Macros {
  if (slot?.recipe) return recipePerPortie(slot.recipe);
  if (slot?.ingredient && slot.ingredientHoeveelheidGram) {
    return ingredientMacros(slot.ingredient, slot.ingredientHoeveelheidGram);
  }
  return emptyMacros();
}

export function isSlotFilled(slot: any) {
  return !!(slot?.recipeId || slot?.ingredientId);
}
