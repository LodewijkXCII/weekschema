export const MEAL_MOMENTS = [
  { key: "ontbijt", label: "Ontbijt", categorie: "ontbijt" },
  { key: "tussendoor_1", label: "Tussendoor", categorie: "tussendoor" },
  { key: "lunch", label: "Lunch", categorie: "lunch" },
  { key: "tussendoor_2", label: "Tussendoor", categorie: "tussendoor" },
  { key: "diner", label: "Diner", categorie: "diner" }
] as const;

// Vanaf hoe laat (uur van de dag) een eetmoment "aan de beurt" is. Gebruikt
// door de kiosk om op mobiel naar het huidige moment te scrollen.
export const MOMENT_VANAF_UUR: Record<(typeof MEAL_MOMENTS)[number]["key"], number> = {
  ontbijt: 0,
  tussendoor_1: 10,
  lunch: 12,
  tussendoor_2: 14.5,
  diner: 17
};

export function currentMomentKey(now = new Date()) {
  const uur = now.getHours() + now.getMinutes() / 60;
  let huidig: (typeof MEAL_MOMENTS)[number]["key"] = MEAL_MOMENTS[0].key;
  for (const m of MEAL_MOMENTS) if (uur >= MOMENT_VANAF_UUR[m.key]) huidig = m.key;
  return huidig;
}

// Bij ontbijt en diner eten we standaard met 2,5 personen; bij de andere
// momenten is de standaard het aantal porties van het recept (of 1 persoon
// voor een los ingrediënt). Per vakje te overschrijven via mealSlots.personen.
export const PERSONEN_HOOFDMAALTIJD = 2.5;

export function defaultPersonen(slot: any): number {
  if (slot.mealMoment === "ontbijt" || slot.mealMoment === "diner") return PERSONEN_HOOFDMAALTIJD;
  return slot.recipe?.porties ?? 1;
}

export function slotPersonen(slot: any): number {
  return slot.personen ?? defaultPersonen(slot);
}

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
