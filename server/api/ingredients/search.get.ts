import { requireHousehold } from "../../utils/session";
import { searchAhProducts } from "../../utils/ahApi";

// GET /api/ingredients/search?q=sojasaus -- live productzoekopdracht bij
// Albert Heijn, met voedingswaarden per 100g/ml, voor het automatisch
// invullen van het ingrediënt-formulier.
export default defineEventHandler(async (event) => {
  await requireHousehold(event);

  const query = getQuery(event);
  const q = typeof query.q === "string" ? query.q.trim() : "";
  if (q.length < 2) return [];

  try {
    return await searchAhProducts(q);
  } catch (e) {
    throw createError({
      statusCode: 502,
      statusMessage: "Kon Albert Heijn niet bereiken -- vul de macro's zo nodig handmatig in"
    });
  }
});
