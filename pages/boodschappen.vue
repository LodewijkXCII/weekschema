<template>
  <div class="mx-auto max-w-[900px] px-4 py-6 lg:px-6">
    <PageHeader
      :icon="ShoppingCart"
      title="Boodschappenlijst"
      :subtitle="`Automatisch uit je planning · ${checkedCount}/${shoppingList.length} afgevinkt`"
    >
      <NuxtLink :to="`/?week=${isoDate(weekStart)}`" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
        <ArrowLeft class="size-4" /> Planner
      </NuxtLink>
    </PageHeader>

    <div class="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2 shadow-soft">
      <button type="button" aria-label="Vorige week" class="grid size-9 place-items-center rounded-xl border border-border transition-colors hover:bg-secondary" @click="shiftWeek(-1)">
        <ChevronLeft class="size-4" />
      </button>
      <div class="text-center">
        <div class="font-display font-semibold">{{ formatWeekDate(weekStart) }}</div>
        <div class="text-xs text-muted-foreground">week van {{ isoDate(weekStart) }}</div>
      </div>
      <button type="button" aria-label="Volgende week" class="grid size-9 place-items-center rounded-xl border border-border transition-colors hover:bg-secondary" @click="shiftWeek(1)">
        <ChevronRight class="size-4" />
      </button>
    </div>

    <div v-if="!plan" class="text-sm text-muted-foreground">Laden…</div>

    <template v-else>
      <div v-if="weekRecipes.length === 0 && weekLooseIngredients.length === 0" class="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Er staan nog geen gerechten in deze week. <NuxtLink :to="`/?week=${isoDate(weekStart)}`" class="font-medium text-primary underline-offset-4 hover:underline">Vul eerst het weekbord in</NuxtLink>.
      </div>

      <template v-else>
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-base font-display font-semibold">Boodschappenlijst</h2>
          <div class="flex gap-2">
            <button type="button" class="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary" @click="setAllChecked(true)">Alles aanvinken</button>
            <button type="button" class="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary" @click="setAllChecked(false)">Alles uitvinken</button>
          </div>
        </div>

        <div v-for="[categorie, items] in groupedShoppingList" :key="categorie" class="mb-2.5 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <p class="border-b border-border bg-secondary/60 px-3.5 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{{ categorie }}</p>
          <label v-for="item in items" :key="item.naam" class="flex cursor-pointer items-center gap-2.5 border-b border-border px-3.5 py-2 last:border-b-0">
            <input type="checkbox" v-model="checked[item.naam]" class="size-4 accent-primary" />
            <span class="flex-1 text-sm" :class="checked[item.naam] ? '' : 'text-muted-foreground line-through'">{{ item.naam }}</span>
            <span class="text-xs text-muted-foreground">{{ formatAmount(item.gram) }}</span>
          </label>
        </div>

        <div v-if="basisItems.length" class="mt-5 overflow-hidden rounded-2xl border border-dashed border-border bg-card shadow-soft">
          <div class="border-b border-border bg-secondary/60 px-3.5 py-2">
            <p class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Niet vergeten</p>
            <p class="mt-0.5 text-xs text-muted-foreground">Basisvoorraad -- meestal al in huis. Vink aan wat op is.</p>
          </div>
          <label v-for="item in basisItems" :key="item.naam" class="flex cursor-pointer items-center gap-2.5 border-b border-border px-3.5 py-2 last:border-b-0">
            <input type="checkbox" v-model="checked[item.naam]" class="size-4 accent-primary" />
            <span class="flex-1 text-sm" :class="checked[item.naam] ? '' : 'text-muted-foreground line-through'">{{ item.naam }}</span>
            <span class="text-xs text-muted-foreground">{{ formatAmount(item.gram) }}</span>
          </label>
        </div>

        <template v-if="weekRecipes.length">
          <h2 class="mt-6 mb-2 text-base font-display font-semibold">Gerechten deze week</h2>
          <p class="mb-3 text-xs text-muted-foreground">
            Ontbijt en diner gaan standaard uit van {{ PERSONEN_HOOFDMAALTIJD.toLocaleString("nl") }} personen per keer.
            Eten er meer of minder mensen mee? Pas het aantal personen per vakje aan op het
            <NuxtLink :to="`/?week=${isoDate(weekStart)}`" class="font-medium text-primary underline-offset-4 hover:underline">weekbord</NuxtLink>;
            de boodschappenlijst hierboven schaalt automatisch mee.
          </p>
          <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div v-for="entry in weekRecipes" :key="entry.recipe.id" class="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
              <div class="w-11 shrink-0 overflow-hidden rounded-lg">
                <RecipeThumb :recipe="entry.recipe" compact />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ entry.recipe.naam }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">{{ entry.occurrences }}× deze week · recept voor {{ entry.recipe.porties }} portie(s)</p>
              </div>
              <span class="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
                <Users class="size-3.5" /> {{ entry.personen.toLocaleString("nl") }} pers.
              </span>
            </div>
          </div>
        </template>

        <template v-if="weekLooseIngredients.length">
          <h2 class="mt-6 mb-2 text-base font-display font-semibold">Losse ingrediënten</h2>
          <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div v-for="entry in weekLooseIngredients" :key="entry.ingredient.id" class="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
              <div class="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary/70">
                <Apple class="size-5 text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ entry.ingredient.naam }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">{{ entry.occurrences }}× deze week</p>
              </div>
              <span class="shrink-0 text-xs tabular-nums text-muted-foreground">{{ formatAmount(entry.gram) }}</span>
            </div>
          </div>
        </template>

        <h2 class="mt-6 mb-2 text-base font-display font-semibold">Tijdelijk exporteren</h2>
        <p class="mb-3 text-xs text-muted-foreground">
          Een echte koppeling met de Albert Heijn-boodschappenlijst is er nog niet (zie de "Nog te doen"-lijst in de
          README). Kopieer voor nu de aangevinkte items hieronder en plak ze handmatig in de AH-app.
        </p>
        <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <textarea readonly rows="8" class="w-full resize-y rounded-xl border border-border bg-background p-2.5 font-sans text-sm outline-none">{{ exportText }}</textarea>
          <div class="mt-2.5 flex items-center gap-3">
            <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" @click="copyList">
              <Copy class="size-4" /> {{ copied ? "Gekopieerd ✓" : "Kopieer lijst" }}
            </button>
            <span class="text-xs text-muted-foreground">{{ checkedCount }} van {{ shoppingList.length }} items aangevinkt</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Copy, Apple, Users } from "lucide-vue-next";
import { isoDate, formatWeekDate, weekStartFromQuery } from "~/composables/useWeek";
import { PERSONEN_HOOFDMAALTIJD, slotPersonen } from "~/composables/useMealMoments";

const route = useRoute();

const weekStart = ref(weekStartFromQuery(route.query.week));

const plan = ref<any>(null);
const checked = reactive<Record<string, boolean>>({});
const copied = ref(false);

async function loadWeek() {
  plan.value = await $fetch(`/api/weekplans/${isoDate(weekStart.value)}`);
}

function shiftWeek(delta: number) {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + delta * 7);
  weekStart.value = d;
  loadWeek();
}

// Per recept opgeteld: hoe vaak het op het weekbord staat en voor hoeveel
// personen in totaal (per vakje opgeslagen, zie slotPersonen()).
const weekRecipes = computed(() => {
  const map = new Map<string, { recipe: any; occurrences: number; personen: number }>();
  for (const slot of plan.value?.slots ?? []) {
    if (!slot.recipe) continue;
    const personen = slotPersonen(slot);
    const existing = map.get(slot.recipe.id);
    if (existing) {
      existing.occurrences++;
      existing.personen += personen;
    } else {
      map.set(slot.recipe.id, { recipe: slot.recipe, occurrences: 1, personen });
    }
  }
  return [...map.values()].sort((a, b) => a.recipe.naam.localeCompare(b.recipe.naam, "nl"));
});

// Vakjes met één los ingrediënt i.p.v. een recept (bv. een handje noten),
// opgeteld per ingrediënt. De ingevulde hoeveelheid is per persoon, dus keer
// het aantal personen van dat vakje.
const weekLooseIngredients = computed(() => {
  const map = new Map<string, { ingredient: any; gram: number; occurrences: number }>();
  for (const slot of plan.value?.slots ?? []) {
    if (!slot.ingredient || !slot.ingredientHoeveelheidGram) continue;
    const gram = slot.ingredientHoeveelheidGram * slotPersonen(slot);
    const existing = map.get(slot.ingredient.id);
    if (existing) {
      existing.gram += gram;
      existing.occurrences++;
    } else {
      map.set(slot.ingredient.id, { ingredient: slot.ingredient, gram, occurrences: 1 });
    }
  }
  return [...map.values()].sort((a, b) => a.ingredient.naam.localeCompare(b.ingredient.naam, "nl"));
});

interface ShoppingItem {
  naam: string;
  gram: number;
  winkelCategorie: string | null;
  basisvoorraad: boolean;
}

const shoppingList = computed(() => {
  const totals = new Map<string, ShoppingItem>();
  function add(ingredient: any, grams: number) {
    const existing = totals.get(ingredient.naam);
    if (existing) {
      existing.gram += grams;
    } else {
      totals.set(ingredient.naam, {
        naam: ingredient.naam,
        gram: grams,
        winkelCategorie: ingredient.winkelCategorie ?? null,
        basisvoorraad: ingredient.basisvoorraad ?? false
      });
    }
  }
  for (const { recipe, personen } of weekRecipes.value) {
    const factor = personen / recipe.porties;
    for (const ri of recipe.ingredients) add(ri.ingredient, ri.hoeveelheidGram * factor);
  }
  for (const { ingredient, gram } of weekLooseIngredients.value) add(ingredient, gram);
  return [...totals.values()].sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
});

// Gegroepeerd op winkelcategorie voor een overzichtelijke lijst tijdens het
// boodschappen doen; items zonder categorie vallen onder "Overig" onderaan.
// Basisvoorraad staat hier niet in maar apart onder "Niet vergeten".
const groupedShoppingList = computed(() => {
  const groups = new Map<string, ShoppingItem[]>();
  for (const item of shoppingList.value) {
    if (item.basisvoorraad) continue;
    const key = item.winkelCategorie || "Overig";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === "Overig") return b === "Overig" ? 0 : 1;
    if (b === "Overig") return -1;
    return a.localeCompare(b, "nl");
  });
});

const basisItems = computed(() => shoppingList.value.filter((i) => i.basisvoorraad));

// Nieuwe ingrediënten starten aangevinkt, behalve basisvoorraad-items (die
// staan meestal al in huis); bestaande aan/uit-status blijft staan als je
// porties bijstelt.
watch(
  shoppingList,
  (list) => {
    for (const item of list) {
      if (!(item.naam in checked)) checked[item.naam] = !item.basisvoorraad;
    }
  },
  { immediate: true }
);

function setAllChecked(value: boolean) {
  for (const item of shoppingList.value) checked[item.naam] = value;
}

const checkedCount = computed(() => shoppingList.value.filter((i) => checked[i.naam]).length);

function formatAmount(gram: number) {
  if (gram >= 1000) return `${(gram / 1000).toFixed(gram % 1000 === 0 ? 0 : 1)}kg`;
  return `${Math.round(gram)}g`;
}

const exportText = computed(() => {
  // Zelfde volgorde als op het scherm: basisvoorraad achteraan.
  const lines = [...groupedShoppingList.value.flatMap(([, items]) => items), ...basisItems.value]
    .filter((i) => checked[i.naam])
    .map((i) => `- ${i.naam}: ${formatAmount(i.gram)}`);
  return `Boodschappenlijst -- week van ${formatWeekDate(weekStart.value)}\n\n${lines.join("\n")}`;
});

async function copyList() {
  try {
    await navigator.clipboard.writeText(exportText.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // Klembord-API niet beschikbaar/geweigerd -- de tekst staat al zichtbaar
    // in het tekstvak hierboven, dus handmatig selecteren+kopiëren kan altijd.
  }
}

onMounted(() => {
  loadWeek();
});

// Als er (bv. via een link) naar een andere week genavigeerd wordt zonder
// dat de pagina opnieuw gemount wordt.
watch(
  () => route.query.week,
  (week) => {
    if (typeof week !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(week)) return;
    weekStart.value = new Date(week + "T00:00:00");
    loadWeek();
  }
);
</script>
