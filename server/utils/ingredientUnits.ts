// Eenheden voor het invoeren van een recept-ingrediënt hoeveelheid --
// dezelfde omrekenfactoren als de AI-import gebruikt (zie
// server/utils/claude.ts), zodat handmatig invoeren en importeren
// consistent naar dezelfde grammen omrekenen. Bewust geen "cup" hier: die
// weegt te verschillend per ingrediënt (bloem vs. suiker vs. vloeistof) om
// met één vaste factor om te rekenen -- dat kan de AI wel inschatten per
// ingrediënt, een simpele vermenigvuldiger hier niet.
//
// "stuks" is een aparte categorie: perEenheidInGram is hier null, want 1
// stuk appel (~180g) en 1 teen knoflook (~5g) hebben niets met elkaar te
// maken. Die omrekening gebeurt daarom altijd via het gramPerStuk-veld op
// het gekozen ingrediënt zelf (zie eenheidNaarGram hieronder), niet via
// deze tabel.
//
// Staat in server/utils/ (niet composables/) zodat zowel de server-routes
// (auto-import) als de client (via relatieve import vanuit
// composables/useIngredientUnits.ts) precies dezelfde omrekenlogica
// gebruiken -- geen losse, mogelijk uit elkaar lopende kopie aan beide
// kanten.
export const INGREDIENT_UNITS = [
  { key: "gram", label: "gram", perEenheidInGram: 1 },
  { key: "ml", label: "ml", perEenheidInGram: 1 },
  { key: "l", label: "liter", perEenheidInGram: 1000 },
  { key: "eetlepel", label: "eetlepel", perEenheidInGram: 15 },
  { key: "theelepel", label: "theelepel", perEenheidInGram: 5 },
  { key: "snufje", label: "snufje", perEenheidInGram: 0.5 },
  { key: "stuks", label: "stuk(s)", perEenheidInGram: null }
] as const;

export type IngredientUnitKey = (typeof INGREDIENT_UNITS)[number]["key"];

// Voor "stuks" is `gramPerStuk` verplicht (het gewicht van 1 stuk van het
// gekozen ingrediënt) -- zonder dat kan er niet zinvol naar gram omgerekend
// worden, en zou macro-berekening stilzwijgend fout gaan.
export function eenheidNaarGram(
  hoeveelheid: number,
  eenheid: IngredientUnitKey,
  gramPerStuk?: number | null
): number {
  if (eenheid === "stuks") {
    if (!gramPerStuk) {
      throw new Error(
        "Dit ingrediënt heeft geen gewicht per stuk ingesteld -- vul dat eerst in bij het ingrediënt om 'stuks' te kunnen gebruiken."
      );
    }
    return Math.round(hoeveelheid * gramPerStuk * 10) / 10;
  }

  const unit = INGREDIENT_UNITS.find((u) => u.key === eenheid);
  const grammen = hoeveelheid * (unit?.perEenheidInGram ?? 1);
  return Math.round(grammen * 10) / 10;
}
