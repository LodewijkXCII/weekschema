import { requireHousehold } from "../../utils/session";
import { searchAhProducts } from "../../utils/ahApi";
import { searchNevoFoods } from "../../utils/nevo";

// GET /api/ingredients/search?q=sojasaus -- live productzoekopdracht bij
// Albert Heijn + NEVO (RIVM/Voedingscentrum), met voedingswaarden per
// 100g/ml, voor het automatisch invullen van het ingrediënt-formulier.
//
// NEVO staat voorop: dat is een generieke/rauwe-ingrediëntendatabank
// (groente, fruit, bloem, rauw vlees) -- vaak wat je bedoelt bij een
// recept-ingrediënt. Zoek je bv. "appel", dan wil je meestal de rauwe
// vrucht (NEVO), niet AH's "appelsap" of "zak appels" die anders als
// eerste concrete productmatch bovenaan zouden staan. AH-resultaten
// (specifieke merken/verpakkingen) blijven gewoon zichtbaar erna, voor als
// je juist wél een concreet product zoekt.
export default defineEventHandler(async (event) => {
  await requireHousehold(event);

  const query = getQuery(event);
  const q = typeof query.q === "string" ? query.q.trim() : "";
  if (q.length < 2) return [];

  const nevoResults = searchNevoFoods(q);

  let ahResults: Awaited<ReturnType<typeof searchAhProducts>> = [];
  try {
    ahResults = await searchAhProducts(q);
  } catch {
    // AH's onofficiële API kan zonder aankondiging falen -- geen harde
    // fout, dan blijven gewoon de NEVO-resultaten (indien aanwezig) over.
  }

  return [...nevoResults, ...ahResults];
});
