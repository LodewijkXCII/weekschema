export const MEAL_MOMENTS = [
  { key: "ontbijt", label: "Ontbijt", categorie: "ontbijt" },
  { key: "tussendoor_1", label: "Tussendoor", categorie: "tussendoor" },
  { key: "lunch", label: "Lunch", categorie: "lunch" },
  { key: "tussendoor_2", label: "Tussendoor", categorie: "tussendoor" },
  { key: "diner", label: "Diner", categorie: "diner" }
] as const;

// Menselijke labels voor recept-categorieën (moet in sync blijven met
// recipeCategorieen in server/db/schema.ts).
export const RECIPE_CATEGORIE_LABELS: Record<string, string> = {
  ontbijt: "Ontbijt",
  lunch: "Lunch",
  diner: "Diner",
  tussendoor: "Tussendoor"
};

export const WEEK_DAGEN = [
  { key: "maandag", label: "Maandag" },
  { key: "dinsdag", label: "Dinsdag" },
  { key: "woensdag", label: "Woensdag" },
  { key: "donderdag", label: "Donderdag" },
  { key: "vrijdag", label: "Vrijdag" },
  { key: "zaterdag", label: "Zaterdag" },
  { key: "zondag", label: "Zondag" }
] as const;

export const RECIPE_CATEGORIEEN = ["ontbijt", "lunch", "diner", "tussendoor"] as const;
export type RecipeCategorie = (typeof RECIPE_CATEGORIEEN)[number];

// Twee momenten heten allebei "Tussendoor" -- in een rij-/kolomkop willen we
// ze wel uit elkaar kunnen houden.
export function momentRowLabel(moment: { key: string; label: string }) {
  if (moment.key === "tussendoor_1") return "Tussendoor 1";
  if (moment.key === "tussendoor_2") return "Tussendoor 2";
  return moment.label;
}
