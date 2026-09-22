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
      <div v-if="weekRecipes.length === 0" class="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Er staan nog geen gerechten in deze week. <NuxtLink :to="`/?week=${isoDate(weekStart)}`" class="font-medium text-primary underline-offset-4 hover:underline">Vul eerst het weekbord in</NuxtLink>.
      </div>

      <template v-else>
        <h2 class="mb-2 text-base font-display font-semibold">Gerechten deze week</h2>
        <p class="mb-3 text-xs text-muted-foreground">
          Pas het aantal personen per gerecht aan (in stapjes van 0,5 -- handig voor een halve kinderportie). De
          ingrediënten hieronder schalen automatisch mee.
        </p>
        <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div v-for="entry in weekRecipes" :key="entry.recipe.id" class="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
            <div class="w-11 shrink-0 overflow-hidden rounded-lg">
              <RecipeThumb :recipe="entry.recipe" compact />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ entry.recipe.naam }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ entry.occurrences }}× deze week · standaard {{ entry.recipe.porties }} portie(s)</p>
            </div>
            <PortionStepper v-model="portions[entry.recipe.id]" class="shrink-0">
              <span class="text-xs text-muted-foreground">pers.</span>
            </PortionStepper>
          </div>
        </div>

        <div class="mt-6 mb-2 flex items-center justify-between">
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
            <span class="flex-1 text-sm" :class="checked[item.naam] ? '' : 'text-muted-foreground line-through'">
              {{ item.naam }}
              <span v-if="item.basisvoorraad" class="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">basis</span>
            </span>
            <span class="text-xs text-muted-foreground">{{ formatAmount(item.gram) }}</span>
          </label>
        </div>

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
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Copy } from "lucide-vue-next";
import { isoDate, formatWeekDate, weekStartFromQuery } from "~/composables/useWeek";

const route = useRoute();

const weekStart = ref(weekStartFromQuery(route.query.week));

const plan = ref<any>(null);
const portions = reactive<Record<string, number>>({});
const checked = reactive<Record<string, boolean>>({});
const copied = ref(false);

async function loadWeek() {
  plan.value = await $fetch(`/api/weekplans/${isoDate(weekStart.value)}`);

  // Portie-defaults en aangevinkte-status alleen initialiseren voor
  // gerechten die nog niet eerder gezien zijn, zodat handmatige
  // aanpassingen niet verloren gaan bij een herlaad van de data.
  for (const entry of weekRecipesFrom(plan.value)) {
    if (!(entry.recipe.id in portions)) {
      portions[entry.recipe.id] = entry.occurrences * entry.recipe.porties;
    }
  }
}

function shiftWeek(delta: number) {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + delta * 7);
  weekStart.value = d;
  loadWeek();
}

function weekRecipesFrom(planData: any) {
  const map = new Map<string, { recipe: any; occurrences: number }>();
  for (const slot of planData?.slots ?? []) {
    if (!slot.recipe) continue;
    const existing = map.get(slot.recipe.id);
    if (existing) existing.occurrences++;
    else map.set(slot.recipe.id, { recipe: slot.recipe, occurrences: 1 });
  }
  return [...map.values()].sort((a, b) => a.recipe.naam.localeCompare(b.recipe.naam, "nl"));
}

const weekRecipes = computed(() => weekRecipesFrom(plan.value));

interface ShoppingItem {
  naam: string;
  gram: number;
  winkelCategorie: string | null;
  basisvoorraad: boolean;
}

const shoppingList = computed(() => {
  const totals = new Map<string, ShoppingItem>();
  for (const { recipe } of weekRecipes.value) {
    const wantedPortions = portions[recipe.id] ?? recipe.porties;
    const factor = wantedPortions / recipe.porties;
    for (const ri of recipe.ingredients) {
      const grams = ri.hoeveelheidGram * factor;
      const existing = totals.get(ri.ingredient.naam);
      if (existing) {
        existing.gram += grams;
      } else {
        totals.set(ri.ingredient.naam, {
          naam: ri.ingredient.naam,
          gram: grams,
          winkelCategorie: ri.ingredient.winkelCategorie ?? null,
          basisvoorraad: ri.ingredient.basisvoorraad ?? false
        });
      }
    }
  }
  return [...totals.values()].sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
});

// Gegroepeerd op winkelcategorie voor een overzichtelijke lijst tijdens het
// boodschappen doen; items zonder categorie vallen onder "Overig" onderaan.
const groupedShoppingList = computed(() => {
  const groups = new Map<string, ShoppingItem[]>();
  for (const item of shoppingList.value) {
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
  const lines = shoppingList.value
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
