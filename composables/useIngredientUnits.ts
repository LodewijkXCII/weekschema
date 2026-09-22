// Herexporteert de omrekenlogica uit server/utils/ingredientUnits.ts --
// zie dat bestand voor uitleg. Eén bron van waarheid voor client én server.
import { INGREDIENT_UNITS } from "../server/utils/ingredientUnits";
export { INGREDIENT_UNITS, eenheidNaarGram, type IngredientUnitKey } from "../server/utils/ingredientUnits";

// "2 stuk(s)", "30 gram" -- hoe een los ingrediënt in een weekbord-vakje
// wordt weergegeven.
export function formatHoeveelheid(hoeveelheid: number | null | undefined, eenheid: string | null | undefined) {
  if (hoeveelheid == null) return "";
  const label = INGREDIENT_UNITS.find((u) => u.key === eenheid)?.label ?? eenheid ?? "gram";
  return `${hoeveelheid.toLocaleString("nl-NL")} ${label}`;
}
