// Recept-extractie via de Claude API: zet vrije tekst of een foto om naar
// gestructureerde receptdata voor het invoerformulier. Gebruikt de
// gestructureerde-output-feature (output_config.format) zodat het antwoord
// gegarandeerd valide JSON is -- geen fragiele regex/prompt-parsing nodig.
//
// Vereist een eigen ANTHROPIC_API_KEY in .env (zie .env.example) -- kosten
// lopen op het eigen Anthropic-account van de gebruiker, niet gedeeld.
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw createError({
      statusCode: 501,
      statusMessage:
        "ANTHROPIC_API_KEY is niet ingesteld -- vul deze in .env in om recepten te kunnen importeren"
    });
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export type RecipeCategorie = "ontbijt" | "lunch" | "diner" | "tussendoor";

export interface ExtractedRecipe {
  naam: string;
  categorie: RecipeCategorie;
  porties: number;
  bereiding: string | null;
  ingredienten: { naam: string; hoeveelheidGram: number }[];
}

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    naam: { type: "string" },
    categorie: { type: "string", enum: ["ontbijt", "lunch", "diner", "tussendoor"] },
    porties: { type: "integer" },
    bereiding: { type: ["string", "null"] },
    ingredienten: {
      type: "array",
      items: {
        type: "object",
        properties: {
          naam: { type: "string" },
          hoeveelheidGram: { type: "number" }
        },
        required: ["naam", "hoeveelheidGram"],
        additionalProperties: false
      }
    }
  },
  required: ["naam", "categorie", "porties", "bereiding", "ingredienten"],
  additionalProperties: false
} as const;

const SYSTEM_PROMPT = `Je zet een kookrecept (uit tekst of een foto) om naar gestructureerde data voor een maaltijdplanner-app.

Regels:
- "categorie" is exact een van: "ontbijt", "lunch", "diner", "tussendoor" -- kies wat het meest logisch is voor dit gerecht.
- "porties" is een geheel getal (waarvoor het recept standaard bedoeld is). Gebruik 1 als dit niet duidelijk is.
- "hoeveelheidGram" is altijd in grammen -- reken elke andere eenheid om, ook uit Engelstalige/Amerikaanse bronnen:
  - Vloeistoffen: 1 ml ≈ 1 g, 1 liter = 1000 g.
  - "Cup" (Amerikaans): ≈ 240 g voor vloeistoffen, maar voor droge ingrediënten hangt het af van het ingrediënt (bv. 1 cup bloem ≈ 120 g, 1 cup suiker ≈ 200 g, 1 cup rijst (droog) ≈ 190 g) -- gebruik een realistische dichtheid per ingrediënt, cups zijn geen vaste 240 g voor alles.
  - Eetlepel/tablespoon (tbsp) ≈ 15 g/ml, theelepel/teaspoon (tsp) ≈ 5 g/ml, snufje/pinch ≈ 0,5 g.
  - Pound/lb ≈ 454 g, ounce/oz ≈ 28 g.
  - Vage hoeveelheden ("1 teentje", "naar smaak") -> een redelijke schatting in grammen.
- Laat ingrediënten zonder zinnige hoeveelheid (bv. "naar smaak serveren met...") weg.
- "bereiding" is de bereidingswijze als doorlopende tekst, of null als die ontbreekt. Noemt de tekst een oventemperatuur: reken Fahrenheit om naar Celsius indien nodig, en rond af op de dichtstbijzijnde 5 graden Celsius (bv. 350°F -> 175°C, 177°C -> 175°C).
- Vertaal alles naar het Nederlands, ook als de brontekst een andere taal gebruikt.
- Geef uitsluitend de gevraagde JSON terug.`;

async function runExtraction(content: Anthropic.ContentBlockParam[]): Promise<ExtractedRecipe> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: RECIPE_SCHEMA }
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }]
  });

  if (response.stop_reason === "refusal") {
    throw createError({ statusCode: 422, statusMessage: "Kon hier geen recept in herkennen" });
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) {
    throw createError({ statusCode: 502, statusMessage: "Onverwacht antwoord van Claude" });
  }

  return JSON.parse(textBlock.text) as ExtractedRecipe;
}

export function extractRecipeFromText(text: string) {
  return runExtraction([{ type: "text", text: `Tekst:\n\n${text}` }]);
}

export function extractRecipeFromImage(base64: string, mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif") {
  return runExtraction([
    { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
    { type: "text", text: "Haal het recept uit deze foto." }
  ]);
}
