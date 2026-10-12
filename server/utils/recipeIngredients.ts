import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { recipes, ingredients } from "../db/schema";
import { eenheidNaarGram, type IngredientUnitKey } from "./ingredientUnits";
import { SUB_RECIPE_UNITS, subRecipeNaarGram, type SubRecipeUnitKey } from "./recipeTree";

// Subrecepten kunnen zelf weer subrecepten hebben; dieper dan dit uitklappen
// is in de praktijk nooit nodig en houdt de API-respons begrensd.
const MAX_DIEPTE = 5;

async function loadHouseholdRecipes(householdId: string) {
  return db.query.recipes.findMany({
    where: eq(recipes.householdId, householdId),
    with: { ingredients: { with: { ingredient: true } } }
  });
}

// Hangt aan elke subrecept-regel (`ri.subRecipeId`) het subrecept zelf als
// `ri.subRecipe`, inclusief diens ingrediënten en eventuele eigen
// subrecepten -- zodat flattenRecipe() (recipeTree.ts) alles kan uitklappen.
// `alleRecepten` mag al geladen zijn (bv. door de recepten-lijst); anders
// wordt het hier alleen opgehaald als er echt subrecepten in zitten.
export async function hydrateSubRecipes(roots: any[], householdId: string, alleRecepten?: any[]) {
  const heeftSubrecepten = roots.some((r) => r?.ingredients?.some((ri: any) => ri.subRecipeId));
  if (!heeftSubrecepten) return;

  const perId = new Map((alleRecepten ?? (await loadHouseholdRecipes(householdId))).map((r) => [r.id, r]));

  function attach(recipe: any, diepte: number) {
    for (const ri of recipe.ingredients ?? []) {
      if (!ri.subRecipeId) continue;
      const sub = perId.get(ri.subRecipeId);
      ri.subRecipe =
        sub && diepte < MAX_DIEPTE
          ? attach({ ...sub, ingredients: sub.ingredients.map((x: any) => ({ ...x })) }, diepte + 1)
          : null;
    }
    return recipe;
  }

  for (const root of roots) if (root) attach(root, 0);
}

export interface RecipeIngredientInput {
  ingredientId?: string | null;
  subRecipeId?: string | null;
  hoeveelheid: number;
  eenheid: IngredientUnitKey | SubRecipeUnitKey;
}

// Valideert de ingrediëntregels van een recept (POST en PATCH) en rekent
// hoeveelheidGram server-side uit -- nooit een door de client aangeleverde
// hoeveelheidGram vertrouwen. `eigenRecipeId` is het recept dat wordt
// bewerkt: dat mag niet (via een omweg) zichzelf als onderdeel bevatten.
export async function resolveRecipeIngredientRows(
  householdId: string,
  rows: RecipeIngredientInput[],
  eigenRecipeId?: string
) {
  for (const r of rows) {
    if (!!r.ingredientId === !!r.subRecipeId) {
      throw createError({ statusCode: 400, statusMessage: "Elke regel moet óf een ingrediënt óf een recept bevatten" });
    }
  }

  // Ingrediënten van dit huishouden opzoeken -- zowel om gramPerStuk te
  // vinden (nodig voor de eenheid "stuks") als om te garanderen dat elk
  // ingredientId echt bij dit huishouden hoort.
  const ingredientIds = [...new Set(rows.filter((r) => r.ingredientId).map((r) => r.ingredientId!))];
  const gebruikteIngredienten = ingredientIds.length
    ? await db.query.ingredients.findMany({
        where: and(eq(ingredients.householdId, householdId), inArray(ingredients.id, ingredientIds))
      })
    : [];
  if (gebruikteIngredienten.length !== ingredientIds.length) {
    throw createError({ statusCode: 400, statusMessage: "Eén of meer ingrediënten zijn niet gevonden" });
  }
  const gramPerStukPerId = new Map(gebruikteIngredienten.map((i) => [i.id, i.gramPerStuk]));

  const subRecipeIds = [...new Set(rows.filter((r) => r.subRecipeId).map((r) => r.subRecipeId!))];
  const subrecepten = new Map<string, any>();
  if (subRecipeIds.length) {
    const alleRecepten = await loadHouseholdRecipes(householdId);
    const perId = new Map(alleRecepten.map((r) => [r.id, r]));

    for (const id of subRecipeIds) {
      const sub = perId.get(id);
      if (!sub) throw createError({ statusCode: 400, statusMessage: "Eén of meer recepten zijn niet gevonden" });
      if (eigenRecipeId && bevat(id, eigenRecipeId, perId)) {
        throw createError({
          statusCode: 400,
          statusMessage: `"${sub.naam}" kan geen onderdeel zijn van dit recept: dat zou een kringverwijzing geven`
        });
      }
      subrecepten.set(id, { ...sub, ingredients: sub.ingredients.map((x) => ({ ...x })) });
    }
    await hydrateSubRecipes([...subrecepten.values()], householdId, alleRecepten);
  }

  try {
    return rows.map((r) => {
      if (r.subRecipeId) {
        if (!SUB_RECIPE_UNITS.some((u) => u.key === r.eenheid)) {
          throw new Error("Een recept als ingrediënt kan alleen in porties of gram");
        }
        const eenheid = r.eenheid as SubRecipeUnitKey;
        return {
          ingredientId: null,
          subRecipeId: r.subRecipeId,
          hoeveelheid: r.hoeveelheid,
          eenheid,
          hoeveelheidGram: subRecipeNaarGram(r.hoeveelheid, eenheid, subrecepten.get(r.subRecipeId))
        };
      }
      const eenheid = r.eenheid as IngredientUnitKey;
      return {
        ingredientId: r.ingredientId!,
        subRecipeId: null,
        hoeveelheid: r.hoeveelheid,
        eenheid,
        hoeveelheidGram: eenheidNaarGram(r.hoeveelheid, eenheid, gramPerStukPerId.get(r.ingredientId!))
      };
    });
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message });
  }
}

// Bevat recept `vanId` (direct of via subrecepten) recept `doelId`?
function bevat(vanId: string, doelId: string, perId: Map<string, any>, gezien = new Set<string>()): boolean {
  if (vanId === doelId) return true;
  if (gezien.has(vanId)) return false;
  gezien.add(vanId);
  for (const ri of perId.get(vanId)?.ingredients ?? []) {
    if (ri.subRecipeId && bevat(ri.subRecipeId, doelId, perId, gezien)) return true;
  }
  return false;
}
