// Recepten als ingrediënt van een ander recept (bv. een pizzabodem in een
// pizza). Een receptregel verwijst óf naar een ingrediënt (`ri.ingredient`),
// óf naar een subrecept (`ri.subRecipe`, door de server erbij gehangen via
// hydrateSubRecipes() in recipeIngredients.ts).
//
// Staat net als ingredientUnits.ts in server/utils/ zodat de server
// (recepten-API, trends) en de client (weekbord, kiosk, boodschappenlijst,
// receptdetail) precies dezelfde uitklap- en rekenlogica gebruiken.

// Eenheden voor een subrecept-regel: een aantal porties van dat recept, of
// een gewicht -- dat laatste als aandeel van het totale (rauwe)
// ingrediëntengewicht van het subrecept, want een bereid gewicht kennen we
// niet.
export const SUB_RECIPE_UNITS = [
  { key: "portie", label: "portie(s)" },
  { key: "gram", label: "gram" }
] as const;

export type SubRecipeUnitKey = (typeof SUB_RECIPE_UNITS)[number]["key"];

export interface FlatIngredient {
  ingredient: any;
  gram: number;
}

export interface RecipeTotals {
  kcal: number;
  eiwit: number;
  vet: number;
  kh: number;
}

// Klapt een héél recept (alle porties) uit tot losse ingrediënten met hun
// grammen, subrecepten naar rato meegerekend. Dezelfde ingrediënt kan dus
// meerdere keren voorkomen. `pad` beschermt tegen een kringverwijzing (die
// de API al weigert, maar een oneindige lus wil je nooit riskeren).
export function flattenRecipe(recipe: any, pad: Set<string> = new Set()): FlatIngredient[] {
  if (!recipe || pad.has(recipe.id)) return [];
  const binnen = new Set(pad).add(recipe.id);
  const out: FlatIngredient[] = [];
  for (const ri of recipe.ingredients ?? []) {
    if (ri.ingredient) {
      out.push({ ingredient: ri.ingredient, gram: ri.hoeveelheidGram });
    } else if (ri.subRecipe) {
      const sub = flattenRecipe(ri.subRecipe, binnen);
      const fractie = subRecipeFractie(ri, ri.subRecipe, totaalGram(sub));
      for (const s of sub) out.push({ ingredient: s.ingredient, gram: s.gram * fractie });
    }
  }
  return out;
}

// Welk deel van het hele subrecept deze regel gebruikt (1 = alles).
function subRecipeFractie(ri: { hoeveelheid: number | null; hoeveelheidGram: number; eenheid: string | null }, sub: any, subGram: number) {
  const hoeveelheid = ri.hoeveelheid ?? ri.hoeveelheidGram;
  if (ri.eenheid === "gram") return subGram > 0 ? hoeveelheid / subGram : 0;
  return hoeveelheid / (sub.porties || 1);
}

function totaalGram(items: FlatIngredient[]) {
  return items.reduce((sum, i) => sum + i.gram, 0);
}

// Het totale (rauwe) ingrediëntengewicht van een recept, subrecepten
// meegerekend.
export function recipeGram(recipe: any) {
  return totaalGram(flattenRecipe(recipe));
}

// Hoeveel gram van het subrecept een regel van `hoeveelheid` `eenheid`
// betekent -- de momentopname die als hoeveelheidGram wordt opgeslagen.
export function subRecipeNaarGram(hoeveelheid: number, eenheid: SubRecipeUnitKey, sub: any) {
  const gram = eenheid === "gram" ? hoeveelheid : (hoeveelheid / (sub.porties || 1)) * recipeGram(sub);
  return Math.round(gram * 10) / 10;
}

// Macro's voor het hele recept (alle porties).
export function recipeTotals(recipe: any): RecipeTotals {
  const totals = { kcal: 0, eiwit: 0, vet: 0, kh: 0 };
  for (const { ingredient, gram } of flattenRecipe(recipe)) {
    const factor = gram / 100;
    totals.kcal += ingredient.kcalPer100g * factor;
    totals.eiwit += ingredient.eiwitPer100g * factor;
    totals.vet += ingredient.vetPer100g * factor;
    totals.kh += ingredient.koolhydratenPer100g * factor;
  }
  return totals;
}

export function recipePerPortieTotals(recipe: any): RecipeTotals {
  const totals = recipeTotals(recipe);
  const porties = recipe?.porties || 1;
  return { kcal: totals.kcal / porties, eiwit: totals.eiwit / porties, vet: totals.vet / porties, kh: totals.kh / porties };
}
