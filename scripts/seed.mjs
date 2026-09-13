// Eenmalig demo-data script: vult (of hergebruikt) een huishouden met een
// stel realistische ingrediënten en ~30 recepten, puur om te laten zien hoe
// de app eruitziet. Draai met: docker compose exec app node scripts/seed.mjs
//
// Belangrijk: dit script is opzettelijk een upsert-op-naam (nooit een
// delete + reinsert) van ingrediënten/recepten. Recepten die al bestaan
// worden alleen bijgewerkt (categorie/bereiding/porties), zodat hun id
// hetzelfde blijft en eventuele weekbord-toewijzingen (meal_slots) die een
// gebruiker er al aan gekoppeld heeft niet worden losgekoppeld.
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

const ingredientDefs = [
  { naam: "Kipfilet", kcal: 165, eiwit: 31, vet: 3.6, kh: 0 },
  { naam: "Zalmfilet", kcal: 208, eiwit: 20, vet: 13, kh: 0 },
  { naam: "Rundergehakt", kcal: 250, eiwit: 26, vet: 17, kh: 0 },
  { naam: "Volkoren pasta (droog)", kcal: 350, eiwit: 13, vet: 2.5, kh: 66 },
  { naam: "Witte rijst (gekookt)", kcal: 130, eiwit: 2.7, vet: 0.3, kh: 28 },
  { naam: "Zilvervliesrijst (gekookt)", kcal: 111, eiwit: 2.6, vet: 0.9, kh: 23 },
  { naam: "Basmatirijst (gekookt)", kcal: 121, eiwit: 2.5, vet: 0.4, kh: 25 },
  { naam: "Aardappel", kcal: 77, eiwit: 2, vet: 0.1, kh: 17 },
  { naam: "Zoete aardappel", kcal: 86, eiwit: 1.6, vet: 0.1, kh: 20 },
  { naam: "Broccoli", kcal: 34, eiwit: 2.8, vet: 0.4, kh: 7 },
  { naam: "Spinazie", kcal: 23, eiwit: 2.9, vet: 0.4, kh: 3.6 },
  { naam: "Paprika", kcal: 31, eiwit: 1, vet: 0.3, kh: 6 },
  { naam: "Ui", kcal: 40, eiwit: 1.1, vet: 0.1, kh: 9 },
  { naam: "Knoflook", kcal: 149, eiwit: 6.4, vet: 0.5, kh: 33 },
  { naam: "Tomaat", kcal: 18, eiwit: 0.9, vet: 0.2, kh: 3.9 },
  { naam: "Komkommer", kcal: 15, eiwit: 0.7, vet: 0.1, kh: 3.6 },
  { naam: "Wortel", kcal: 41, eiwit: 0.9, vet: 0.2, kh: 10 },
  { naam: "Champignons", kcal: 22, eiwit: 3.1, vet: 0.3, kh: 3.3 },
  { naam: "Courgette", kcal: 17, eiwit: 1.2, vet: 0.3, kh: 3.1 },
  { naam: "Pompoen", kcal: 26, eiwit: 1, vet: 0.1, kh: 7 },
  { naam: "Sla", kcal: 15, eiwit: 1.4, vet: 0.2, kh: 2.9 },
  { naam: "Avocado", kcal: 160, eiwit: 2, vet: 15, kh: 9 },
  { naam: "Ei", kcal: 155, eiwit: 13, vet: 11, kh: 1.1 },
  { naam: "Griekse yoghurt (0%)", kcal: 59, eiwit: 10, vet: 0.4, kh: 3.6 },
  { naam: "Kwark mager", kcal: 47, eiwit: 12, vet: 0.2, kh: 3.8 },
  { naam: "Havermout", kcal: 375, eiwit: 13, vet: 7, kh: 62 },
  { naam: "Volkoren brood", kcal: 250, eiwit: 9, vet: 3.5, kh: 43 },
  { naam: "Tortillawrap", kcal: 310, eiwit: 8, vet: 7, kh: 52 },
  { naam: "Olijfolie", kcal: 884, eiwit: 0, vet: 100, kh: 0 },
  { naam: "Boter", kcal: 717, eiwit: 0.9, vet: 81, kh: 0.1 },
  { naam: "Cheddar kaas", kcal: 403, eiwit: 25, vet: 33, kh: 1.3 },
  { naam: "Mozzarella", kcal: 280, eiwit: 28, vet: 17, kh: 3.1 },
  { naam: "Parmezaanse kaas", kcal: 431, eiwit: 38, vet: 29, kh: 4.1 },
  { naam: "Feta", kcal: 264, eiwit: 14, vet: 21, kh: 4.1 },
  { naam: "Kikkererwten (blik)", kcal: 139, eiwit: 7.5, vet: 2.5, kh: 22 },
  { naam: "Zwarte bonen (blik)", kcal: 130, eiwit: 8.9, vet: 0.5, kh: 23 },
  { naam: "Linzen (gekookt)", kcal: 116, eiwit: 9, vet: 0.4, kh: 20 },
  { naam: "Tofu", kcal: 76, eiwit: 8, vet: 4.8, kh: 1.9 },
  { naam: "Amandelen", kcal: 579, eiwit: 21, vet: 50, kh: 22 },
  { naam: "Walnoten", kcal: 654, eiwit: 15, vet: 65, kh: 14 },
  { naam: "Honing", kcal: 304, eiwit: 0.3, vet: 0, kh: 82 },
  { naam: "Banaan", kcal: 89, eiwit: 1.1, vet: 0.3, kh: 23 },
  { naam: "Appel", kcal: 52, eiwit: 0.3, vet: 0.2, kh: 14 },
  { naam: "Blauwe bessen", kcal: 57, eiwit: 0.7, vet: 0.3, kh: 14 },
  { naam: "Kokosmelk", kcal: 230, eiwit: 2.3, vet: 24, kh: 3.3 },
  { naam: "Rode currypasta", kcal: 100, eiwit: 2, vet: 5, kh: 12 },
  { naam: "Sojasaus", kcal: 53, eiwit: 8, vet: 0.1, kh: 4.9 },
  { naam: "Bloem", kcal: 364, eiwit: 10, vet: 1, kh: 76 },
  { naam: "Melk (halfvol)", kcal: 46, eiwit: 3.4, vet: 1.5, kh: 4.9 },
  { naam: "Slagroom", kcal: 340, eiwit: 2.1, vet: 36, kh: 3 },
  { naam: "Tonijn (blik, op water)", kcal: 116, eiwit: 26, vet: 0.8, kh: 0 },
  { naam: "Garnalen", kcal: 99, eiwit: 24, vet: 0.3, kh: 0.2 },
  { naam: "Spekjes", kcal: 541, eiwit: 37, vet: 42, kh: 1.4 }
];

// categorie: ontbijt | lunch | diner | tussendoor -- gebruikt door het
// weekbord om suggesties per eetmoment te filteren.
const recipeDefs = [
  { naam: "Havermout met banaan en honing", categorie: "ontbijt", porties: 1, bereiding: "Havermout met melk aan de kook brengen, laten sudderen tot dik. Banaan erdoor en afmaken met honing.", ingredienten: [["Havermout", 60], ["Melk (halfvol)", 200], ["Banaan", 100], ["Honing", 15]] },
  { naam: "Griekse yoghurt met blauwe bessen en amandelen", categorie: "tussendoor", porties: 1, bereiding: "Alles in een kom mengen.", ingredienten: [["Griekse yoghurt (0%)", 200], ["Blauwe bessen", 80], ["Amandelen", 15], ["Honing", 10]] },
  { naam: "Roerei met spinazie en volkoren toast", categorie: "ontbijt", porties: 1, bereiding: "Spinazie kort aanbakken in boter, eieren erbij roerbakken. Serveren op geroosterd volkoren brood.", ingredienten: [["Ei", 120], ["Spinazie", 50], ["Boter", 10], ["Volkoren brood", 60]] },
  { naam: "Kwark met appel en walnoten", categorie: "tussendoor", porties: 1, bereiding: "Appel in blokjes snijden en door de kwark mengen, walnoten erover.", ingredienten: [["Kwark mager", 200], ["Appel", 120], ["Walnoten", 20]] },
  { naam: "Avocado toast met ei", categorie: "ontbijt", porties: 1, bereiding: "Brood roosteren, avocado erop prakken, gebakken ei en plakjes tomaat erbij.", ingredienten: [["Volkoren brood", 60], ["Avocado", 80], ["Ei", 60], ["Tomaat", 50]] },
  { naam: "Kipfilet met zoete aardappel en broccoli", categorie: "diner", porties: 2, bereiding: "Zoete aardappel roosteren in de oven, kip bakken, broccoli stomen. Alles opdienen met een scheut olijfolie.", ingredienten: [["Kipfilet", 300], ["Zoete aardappel", 400], ["Broccoli", 300], ["Olijfolie", 15]] },
  { naam: "Zalm met basmatirijst en spinazie", categorie: "diner", porties: 2, bereiding: "Zalm bakken, rijst koken, spinazie kort laten slinken met knoflook.", ingredienten: [["Zalmfilet", 300], ["Basmatirijst (gekookt)", 300], ["Spinazie", 150], ["Olijfolie", 15], ["Knoflook", 10]] },
  { naam: "Rundergehakt bolognese met volkoren pasta", categorie: "diner", porties: 3, bereiding: "Ui en knoflook glazig bakken, gehakt erbij bruinen, tomaten toevoegen en laten sudderen. Serveren met pasta en parmezaan.", ingredienten: [["Rundergehakt", 400], ["Volkoren pasta (droog)", 250], ["Tomaat", 400], ["Ui", 80], ["Knoflook", 15], ["Parmezaanse kaas", 40]] },
  { naam: "Kip curry met kokosmelk en rijst", categorie: "diner", porties: 2, bereiding: "Ui en paprika bakken, currypasta erdoor, kip en kokosmelk toevoegen en laten sudderen. Serveren met rijst.", ingredienten: [["Kipfilet", 300], ["Kokosmelk", 200], ["Rode currypasta", 30], ["Witte rijst (gekookt)", 300], ["Paprika", 100], ["Ui", 60]] },
  { naam: "Groente stir-fry met tofu", categorie: "diner", porties: 2, bereiding: "Tofu goudbruin bakken, groenten kort meebakken op hoog vuur, afmaken met sojasaus.", ingredienten: [["Tofu", 250], ["Broccoli", 150], ["Paprika", 100], ["Wortel", 80], ["Sojasaus", 25], ["Olijfolie", 15]] },
  { naam: "Chili sin carne", categorie: "diner", porties: 3, bereiding: "Ui, knoflook en paprika bakken, bonen en tomaat toevoegen, 20 minuten laten sudderen.", ingredienten: [["Zwarte bonen (blik)", 300], ["Kikkererwten (blik)", 150], ["Tomaat", 300], ["Ui", 80], ["Paprika", 100], ["Knoflook", 15]] },
  { naam: "Linzensoep met wortel en ui", categorie: "lunch", porties: 2, bereiding: "Ui en wortel aanfruiten, linzen en bouillon toevoegen, 20 minuten laten koken.", ingredienten: [["Linzen (gekookt)", 300], ["Wortel", 150], ["Ui", 80], ["Knoflook", 10], ["Olijfolie", 15]] },
  { naam: "Griekse salade met feta", categorie: "lunch", porties: 2, bereiding: "Alle groenten in stukken snijden, feta erover, afmaken met olijfolie.", ingredienten: [["Komkommer", 200], ["Tomaat", 200], ["Feta", 100], ["Olijfolie", 15], ["Ui", 40]] },
  { naam: "Caprese salade", categorie: "lunch", porties: 2, bereiding: "Tomaat en mozzarella plakken, afwisselend opstapelen, olijfolie eroverheen.", ingredienten: [["Tomaat", 250], ["Mozzarella", 150], ["Olijfolie", 15]] },
  { naam: "Tonijnsalade met ei en komkommer", categorie: "lunch", porties: 1, bereiding: "Alle ingrediënten mengen in een kom.", ingredienten: [["Tonijn (blik, op water)", 120], ["Ei", 60], ["Komkommer", 100], ["Olijfolie", 10]] },
  { naam: "Kipwrap met paprika en yoghurtsaus", categorie: "lunch", porties: 1, bereiding: "Kip en paprika bakken, in de wrap vouwen met een klodder yoghurt.", ingredienten: [["Kipfilet", 120], ["Tortillawrap", 60], ["Paprika", 60], ["Griekse yoghurt (0%)", 50]] },
  { naam: "Omelet met champignons en kaas", categorie: "ontbijt", porties: 1, bereiding: "Champignons bakken, eieren erbij, kaas erover strooien en laten stollen.", ingredienten: [["Ei", 150], ["Champignons", 80], ["Cheddar kaas", 30], ["Boter", 10]] },
  { naam: "Pompoensoep met kokosmelk", categorie: "lunch", porties: 2, bereiding: "Pompoen en ui zacht koken in bouillon, pureren, kokosmelk erdoor.", ingredienten: [["Pompoen", 400], ["Kokosmelk", 200], ["Ui", 60], ["Knoflook", 10]] },
  { naam: "Gegrilde garnalen met courgette", categorie: "diner", porties: 2, bereiding: "Garnalen kort bakken met knoflook, courgette meebakken, serveren met rijst.", ingredienten: [["Garnalen", 250], ["Courgette", 200], ["Knoflook", 15], ["Olijfolie", 15], ["Basmatirijst (gekookt)", 300]] },
  { naam: "Shakshuka", categorie: "ontbijt", porties: 2, bereiding: "Ui, paprika en knoflook bakken, tomaat toevoegen en laten inkoken, eieren erin pocheren.", ingredienten: [["Ei", 120], ["Tomaat", 300], ["Paprika", 100], ["Ui", 60], ["Knoflook", 15], ["Olijfolie", 15]] },
  { naam: "Aardappel-ovenschotel met spek en kaas", categorie: "diner", porties: 3, bereiding: "Aardappelschijfjes met spek en room in een ovenschaal, kaas erover, 40 minuten op 180°C.", ingredienten: [["Aardappel", 500], ["Spekjes", 80], ["Cheddar kaas", 80], ["Slagroom", 80]] },
  { naam: "Rijstbowl met kikkererwten en avocado", categorie: "lunch", porties: 1, bereiding: "Alle ingrediënten in een kom opstapelen.", ingredienten: [["Zilvervliesrijst (gekookt)", 200], ["Kikkererwten (blik)", 150], ["Avocado", 80], ["Tomaat", 80], ["Komkommer", 80]] },
  { naam: "Broodje kip met avocado", categorie: "lunch", porties: 1, bereiding: "Brood beleggen met kip, avocado en komkommer.", ingredienten: [["Volkoren brood", 70], ["Kipfilet", 100], ["Avocado", 50], ["Komkommer", 40]] },
  { naam: "Notenmix", categorie: "tussendoor", porties: 1, bereiding: "Gewoon mengen.", ingredienten: [["Amandelen", 25], ["Walnoten", 25]] },
  { naam: "Appel met kaas", categorie: "tussendoor", porties: 1, bereiding: "Appel in partjes, kaas in blokjes.", ingredienten: [["Appel", 150], ["Cheddar kaas", 30]] },
  { naam: "Kwark met honing en walnoten", categorie: "tussendoor", porties: 1, bereiding: "Alles mengen in een kom.", ingredienten: [["Kwark mager", 200], ["Honing", 15], ["Walnoten", 20]] },
  { naam: "Fruit-smoothie met banaan", categorie: "tussendoor", porties: 1, bereiding: "Alles in de blender tot een gladde smoothie.", ingredienten: [["Banaan", 120], ["Griekse yoghurt (0%)", 150], ["Melk (halfvol)", 100], ["Honing", 10]] },
  { naam: "Volkoren pannenkoeken", categorie: "ontbijt", porties: 2, bereiding: "Bloem, melk en ei mengen tot beslag, uitbakken in boter.", ingredienten: [["Bloem", 160], ["Melk (halfvol)", 400], ["Ei", 120], ["Boter", 15]] },
  { naam: "Champignonrisotto met parmezaan", categorie: "diner", porties: 2, bereiding: "Ui bakken, rijst en champignons toevoegen, geleidelijk bouillon toevoegen tot romig, afmaken met kaas en boter.", ingredienten: [["Witte rijst (gekookt)", 300], ["Champignons", 200], ["Parmezaanse kaas", 40], ["Ui", 60], ["Boter", 20]] },
  { naam: "Kip caesar salade", categorie: "lunch", porties: 1, bereiding: "Kip bakken en in reepjes snijden, mengen met sla, kaas en ei.", ingredienten: [["Kipfilet", 120], ["Sla", 100], ["Parmezaanse kaas", 20], ["Ei", 60], ["Olijfolie", 10]] }
];

async function main() {
  let [household] = await sql`select id, naam, invite_code as "inviteCode" from households limit 1`;

  if (!household) {
    [household] = await sql`
      insert into households (naam, invite_code)
      values ('Demo huishouden', 'DEMO01')
      returning id, naam, invite_code as "inviteCode"
    `;
    console.log(`Nieuw huishouden aangemaakt: "${household.naam}" (uitnodigingscode: ${household.inviteCode})`);
  } else {
    console.log(`Bestaand huishouden hergebruikt: "${household.naam}" (uitnodigingscode: ${household.inviteCode})`);
  }

  const householdId = household.id;

  // Ingrediënten: upsert op naam (nooit deleten -- recept_ingredients
  // verwijst ernaar).
  const ingredientIds = {};
  let newIngredients = 0;
  for (const ing of ingredientDefs) {
    const [existing] = await sql`
      select id from ingredients where household_id = ${householdId} and naam = ${ing.naam}
    `;
    if (existing) {
      ingredientIds[ing.naam] = existing.id;
      continue;
    }
    const [row] = await sql`
      insert into ingredients (household_id, naam, kcal_per_100g, eiwit_per_100g, vet_per_100g, koolhydraten_per_100g)
      values (${householdId}, ${ing.naam}, ${ing.kcal}, ${ing.eiwit}, ${ing.vet}, ${ing.kh})
      returning id
    `;
    ingredientIds[ing.naam] = row.id;
    newIngredients++;
  }

  // Recepten: upsert op naam. Bestaande recepten worden alleen bijgewerkt
  // (categorie/bereiding/porties) -- hun id blijft gelijk, dus eventuele
  // weekbord-toewijzingen (meal_slots.recipe_id) blijven intact. Alleen
  // écht nieuwe receptnamen krijgen ook nieuwe recipe_ingredients-rijen.
  let newRecipes = 0;
  let updatedRecipes = 0;
  for (const r of recipeDefs) {
    const [existing] = await sql`
      select id from recipes where household_id = ${householdId} and naam = ${r.naam}
    `;

    if (existing) {
      await sql`
        update recipes
        set categorie = ${r.categorie}, bereiding = ${r.bereiding}, porties = ${r.porties}
        where id = ${existing.id}
      `;
      updatedRecipes++;
      continue;
    }

    const [row] = await sql`
      insert into recipes (household_id, naam, categorie, bereiding, porties)
      values (${householdId}, ${r.naam}, ${r.categorie}, ${r.bereiding}, ${r.porties})
      returning id
    `;
    for (const [ingredientNaam, gram] of r.ingredienten) {
      const ingredientId = ingredientIds[ingredientNaam];
      if (!ingredientId) throw new Error(`Onbekend ingrediënt "${ingredientNaam}" in recept "${r.naam}"`);
      await sql`
        insert into recipe_ingredients (recipe_id, ingredient_id, hoeveelheid_gram)
        values (${row.id}, ${ingredientId}, ${gram})
      `;
    }
    newRecipes++;
  }

  console.log(
    `Klaar: ${newIngredients} nieuwe ingrediënten (${ingredientDefs.length - newIngredients} bestonden al), ` +
      `${newRecipes} nieuwe recepten en ${updatedRecipes} bijgewerkte recepten.`
  );
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
