<template>
  <div class="w-full px-4 py-6 lg:px-8">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-bold text-foreground">Weekplanner</h1>
        <p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays class="size-3.5" />
          Week van {{ formatWeekDate(weekStart) }} · sleep gerechten naar een eetmoment
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <button type="button" aria-label="Vorige week" class="grid size-7 place-items-center rounded-lg transition-colors hover:bg-secondary" @click="shiftWeek(-1)">
            <ChevronLeft class="size-4" />
          </button>
          <button type="button" class="rounded-lg px-2 py-1 text-sm font-medium hover:bg-secondary" @click="goToday">Deze week</button>
          <button type="button" aria-label="Volgende week" class="grid size-7 place-items-center rounded-lg transition-colors hover:bg-secondary" @click="shiftWeek(1)">
            <ChevronRight class="size-4" />
          </button>
        </div>
        <select
          v-if="targetProfiles.length > 1"
          v-model="activeProfileId"
          class="rounded-xl border border-border bg-card px-2 py-2 text-sm font-medium outline-none"
          @change="onProfileChange"
        >
          <option v-for="p in targetProfiles" :key="p.id" :value="p.id">{{ p.naam }}</option>
        </select>
        <template v-if="mode === 'edit'">
          <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary" @click="copyPreviousWeek">
            <ClipboardCopy class="size-4" /> Kopieer vorige week
          </button>
          <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary" @click="autoFillWeek">
            <Wand2 class="size-4" /> Vul week
          </button>
        </template>
        <NuxtLink :to="`/boodschappen?week=${isoDate(weekStart)}`" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
          <ShoppingCart class="size-4" /> Boodschappen
        </NuxtLink>
        <NuxtLink to="/trends" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
          <TrendingUp class="size-4" /> Trends
        </NuxtLink>
        <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" @click="toggleMode">
          <component :is="mode === 'edit' ? Lock : Pencil" class="size-4" />
          {{ mode === "edit" ? "Opslaan" : "Bewerken" }}
        </button>
      </div>
    </header>

    <div v-if="!plan" class="text-sm text-muted-foreground">Laden…</div>

    <template v-else>
      <div class="mb-5 grid grid-cols-3 gap-3">
        <div class="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <div class="text-xs font-medium text-muted-foreground">Geplande dagen</div>
          <div class="font-display text-xl font-bold tabular-nums">{{ plannedDaysCount }}/7</div>
        </div>
        <div class="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <div class="text-xs font-medium text-muted-foreground">Gerechten deze week</div>
          <div class="font-display text-xl font-bold tabular-nums">{{ totalDishesCount }}</div>
        </div>
        <div class="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <div class="text-xs font-medium text-muted-foreground">Gem. kcal per dag</div>
          <div class="font-display text-xl font-bold tabular-nums">{{ avgKcalPerDay ?? "—" }}</div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table class="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <thead>
            <tr class="bg-secondary/60">
              <th class="sticky left-0 z-10 w-32 bg-secondary/60 p-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Moment</th>
              <th
                v-for="dag in WEEK_DAGEN"
                :key="'h-' + dag.key"
                class="min-w-32 p-3 text-left"
                :class="{ 'bg-primary/10': isToday(dag.key) }"
              >
                <span class="flex flex-col items-start gap-0.5">
                  <span class="font-display text-sm font-semibold" :class="{ 'text-primary': isToday(dag.key) }">
                    {{ dag.label }}
                    <span v-if="isToday(dag.key)" class="ml-1.5 text-[10px] font-medium uppercase">vandaag</span>
                  </span>
                  <span class="text-xs font-normal tabular-nums text-muted-foreground">{{ dayDate(dag.key) }}</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="moment in MEAL_MOMENTS" :key="moment.key" class="border-t border-border">
              <th class="sticky left-0 z-10 bg-secondary/30 p-3 text-left align-top">
                <div class="font-display text-sm font-semibold">{{ momentRowLabel(moment) }}</div>
              </th>
              <td
                v-for="dag in WEEK_DAGEN"
                :key="dag.key + moment.key"
                class="group relative border-l border-border p-1.5 align-top transition-colors"
                :class="{
                  'bg-accent/15': dragOverKey === dag.key + moment.key,
                  'bg-primary/5': isToday(dag.key) && dragOverKey !== dag.key + moment.key
                }"
                @dragover.prevent="onDragOver(dag.key, moment.key)"
                @dragleave="onDragLeave"
                @drop="onDrop(dag.key, moment.key)"
              >
                <div class="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-xl">
                  <div v-if="slotFor(dag.key, moment.key)?.recipe" class="relative flex h-full cursor-pointer flex-col" @click="onFilledClick(dag.key, moment.key)">
                    <span
                      v-if="kokInitial(slotFor(dag.key, moment.key)?.kokUserId)"
                      class="absolute top-1 right-1 z-10 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                      :title="kokNaam(slotFor(dag.key, moment.key)?.kokUserId)"
                    >
                      {{ kokInitial(slotFor(dag.key, moment.key)?.kokUserId) }}
                    </span>
                    <div class="min-h-0 flex-1 overflow-hidden rounded-lg">
                      <RecipeThumb :recipe="slotFor(dag.key, moment.key)!.recipe!" fill />
                    </div>
                    <p class="mt-1 truncate text-xs font-medium shrink-0" :title="slotFor(dag.key, moment.key)!.recipe!.naam">
                      <StickyNote v-if="slotFor(dag.key, moment.key)?.notitie" class="mr-0.5 inline size-3 -translate-y-px text-accent" />
                      {{ slotFor(dag.key, moment.key)!.recipe!.naam }}
                    </p>
                    <div v-if="mode === 'edit'" class="absolute inset-x-0 bottom-6 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent pt-4 pb-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" title="Notitie" class="grid size-5 place-items-center rounded text-white hover:bg-white/20" @click.stop="editNotitie(dag.key, moment.key)">
                        <StickyNote class="size-3" />
                      </button>
                      <button type="button" title="Wie kookt" class="grid size-5 place-items-center rounded text-white hover:bg-white/20" @click.stop="cycleKok(dag.key, moment.key)">
                        <User class="size-3" />
                      </button>
                      <button type="button" title="Verwijderen" class="grid size-5 place-items-center rounded text-white hover:bg-white/20" @click.stop="clearSlot(dag.key, moment.key)">
                        <X class="size-3" />
                      </button>
                    </div>
                  </div>
                  <div v-else-if="mode === 'edit'" class="flex h-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border">
                    <span class="text-xs text-muted-foreground/50 group-hover:hidden">+ voeg toe</span>
                    <div class="hidden gap-1 group-hover:flex">
                      <button type="button" title="Zoek recept" class="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" @click="openSearch(dag.key, moment.key)">
                        <Search class="size-3.5" />
                      </button>
                      <button type="button" title="Suggestie" class="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" @click="suggestRandom(dag.key, moment.key)">
                        <Dices class="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div v-else class="flex h-full items-center justify-center rounded-xl border border-dashed border-border">
                    <span class="text-xs text-muted-foreground/50">—</span>
                  </div>
                </div>

                <div v-if="mode === 'edit' && activeCell === dag.key + '|' + moment.key" class="absolute top-full z-20 mt-1 w-56 rounded-2xl border border-border bg-card p-2 shadow-lift" :class="dag.key === 'zaterdag' || dag.key === 'zondag' ? 'right-0' : 'left-0'">
                  <p class="mb-1.5 px-1 text-[10px] font-semibold tracking-wide text-primary uppercase">{{ RECIPE_CATEGORIE_LABELS[moment.categorie] }}</p>
                  <input
                    v-model="searchQuery"
                    autofocus
                    placeholder="Zoek recept…"
                    class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    @keydown.esc="closePopover"
                  />
                  <button type="button" class="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary" @click="suggestFromPopover(dag.key, moment.key)">
                    <Dices class="size-3.5" /> Suggestie
                  </button>
                  <div class="mt-1.5 max-h-44 overflow-y-auto">
                    <div
                      v-for="r in filteredRecipes"
                      :key="r.id"
                      class="cursor-pointer rounded-xl px-2 py-1.5 text-sm hover:bg-secondary"
                      @click="chooseRecipe(dag.key, moment.key, r.id)"
                    >
                      {{ r.favoriet ? "★ " : "" }}{{ r.naam }}
                    </div>
                    <p v-if="filteredRecipes.length === 0" class="p-1.5 text-xs text-muted-foreground">
                      Geen "{{ RECIPE_CATEGORIE_LABELS[moment.categorie] }}"-recepten gevonden.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-border bg-secondary/30">
              <th class="sticky left-0 z-10 bg-secondary/30 p-3 text-left text-xs font-semibold text-muted-foreground">Totaal</th>
              <td v-for="dag in WEEK_DAGEN" :key="'total-' + dag.key" class="border-l border-border p-2" :title="totalTooltip(dag.key)">
                <div class="flex flex-col items-center gap-1.5">
                  <div class="flex h-9 items-end gap-[3px]">
                    <div v-for="m in TOTAAL_METRICS" :key="m.key" class="flex h-full w-2 items-end overflow-hidden rounded-sm bg-border">
                      <div
                        class="w-full rounded-t-sm transition-all"
                        :style="{
                          height: Math.min(100, pctOfTarget(dag.key, m)) + '%',
                          background: pctOfTarget(dag.key, m) > 100 ? 'var(--destructive)' : `var(${m.kleur})`
                        }"
                      ></div>
                    </div>
                  </div>
                  <div class="text-[11px] font-bold tabular-nums" :style="{ color: metricColor(dag.key, 'kcal') }">
                    {{ Math.round(dayTotals(dag.key).kcal) }} kcal
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <div v-if="activeCell" class="fixed inset-0 z-10" @click="closePopover"></div>

    <template v-if="mode === 'edit'">
      <section class="mt-5 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-display flex items-center gap-2 text-lg font-semibold">
            <ChefHat class="size-4 text-muted-foreground" /> Gerechtenbibliotheek
          </h2>
          <NuxtLink to="/recipes/new" class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90">
            <Plus class="size-4" /> Gerecht toevoegen
          </NuxtLink>
        </div>
        <div class="mt-3 grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
          <div class="relative">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input v-model="librarySearch" placeholder="Zoek een gerecht of tag…" class="w-full rounded-xl border border-border bg-background py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              :class="libraryCategorie === null ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
              @click="libraryCategorie = null"
            >Alle</button>
            <button
              v-for="c in categorieen"
              :key="c"
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              :class="libraryCategorie === c ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
              @click="libraryCategorie = c"
            >{{ RECIPE_CATEGORIE_LABELS[c] }}</button>
          </div>
        </div>
        <p class="mt-3 text-xs text-muted-foreground">{{ libraryRecipes.length }} gerechten — sleep ze naar een eetmoment of klik voor de bereiding</p>
        <div class="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <article
            v-for="r in libraryRecipes"
            :key="r.id"
            draggable="true"
            class="group relative flex cursor-grab items-start gap-3 rounded-2xl border border-border bg-surface p-3 transition-all hover:shadow-lift active:cursor-grabbing"
            @dragstart="draggedRecipeId = r.id"
          >
            <div class="w-12 shrink-0 overflow-hidden rounded-xl">
              <RecipeThumb :recipe="r" compact />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium group-hover:text-primary">{{ r.favoriet ? "★ " : "" }}{{ r.naam }}</p>
              <p class="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {{ Math.round(r.perPortie.kcal) }} kcal · <span style="color:var(--protein)">E {{ Math.round(r.perPortie.eiwit) }}g</span> ·
                <span style="color:var(--carbs)">K {{ Math.round(r.perPortie.kh) }}g</span> ·
                <span style="color:var(--fat)">V {{ Math.round(r.perPortie.vet) }}g</span>
              </p>
              <div v-if="r.tags?.length" class="mt-2 flex flex-wrap gap-1">
                <span v-for="t in r.tags" :key="t" class="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{{ t }}</span>
              </div>
            </div>
          </article>
          <p v-if="libraryRecipes.length === 0" class="text-xs text-muted-foreground">Geen gerechten gevonden.</p>
        </div>
      </section>
    </template>

    <RecipeDetail :recipe="detailRecipe" @close="detailRecipe = null" @updated="onDetailUpdated" />
  </div>
</template>

<script setup lang="ts">
import {
  ChevronLeft, ChevronRight, CalendarDays, ShoppingCart, TrendingUp, Lock, Pencil,
  ClipboardCopy, Wand2, StickyNote, User, X, Search, Dices, ChefHat, Plus
} from "lucide-vue-next";
import { MEAL_MOMENTS, WEEK_DAGEN, RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";
import { mondayOf, isoDate, formatWeekDate } from "~/composables/useWeek";

const route = useRoute();

const weekStart = ref(
  typeof route.query.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(route.query.week)
    ? new Date(route.query.week + "T00:00:00")
    : mondayOf(new Date())
);
const plan = ref<any>(null);
const recipes = ref<any[]>([]);
const targetProfiles = ref<any[]>([]);
const activeProfileId = ref<string>("");
const householdMembers = ref<{ userId: string; naam: string }[]>([]);
const draggedRecipeId = ref<string | null>(null);
const dragOverKey = ref<string | null>(null);

const mode = ref<"edit" | "saved">("edit");
const detailRecipe = ref<any | null>(null);

const activeCell = ref<string | null>(null);
const searchQuery = ref("");

const categorieen = ["ontbijt", "lunch", "diner", "tussendoor"] as const;
const libraryCategorie = ref<string | null>(null);
const librarySearch = ref("");

const targets = computed(
  () =>
    targetProfiles.value.find((t) => t.id === activeProfileId.value) ??
    targetProfiles.value[0] ?? { maxKcal: 2000, maxEiwit: 120, maxVet: 70, maxKoolhydraten: 200 }
);

const activeMoment = computed(() => activeCell.value?.split("|")[1] ?? null);

const libraryRecipes = computed(() => {
  const q = librarySearch.value.trim().toLowerCase();
  return recipes.value.filter((r) => {
    if (libraryCategorie.value && r.categorie !== libraryCategorie.value) return false;
    if (!q) return true;
    return r.naam.toLowerCase().includes(q) || (r.tags ?? []).some((t: string) => t.toLowerCase().includes(q));
  });
});

const plannedDaysCount = computed(
  () => WEEK_DAGEN.filter((dag) => MEAL_MOMENTS.some((m) => slotFor(dag.key, m.key)?.recipeId)).length
);

const totalDishesCount = computed(() =>
  WEEK_DAGEN.reduce((sum, dag) => sum + MEAL_MOMENTS.filter((m) => slotFor(dag.key, m.key)?.recipeId).length, 0)
);

const avgKcalPerDay = computed(() => {
  const withData = WEEK_DAGEN.filter((dag) => MEAL_MOMENTS.some((m) => slotFor(dag.key, m.key)?.recipeId));
  if (!withData.length) return null;
  const total = withData.reduce((sum, dag) => sum + dayTotals(dag.key).kcal, 0);
  return Math.round(total / withData.length);
});

const TOTAAL_METRICS = [
  { key: "kcal" as const, naam: "Kcal", eenheid: "", kleur: "--kcal", targetKey: "maxKcal" as const },
  { key: "eiwit" as const, naam: "Eiwit", eenheid: "g", kleur: "--protein", targetKey: "maxEiwit" as const },
  { key: "kh" as const, naam: "Koolhydraten", eenheid: "g", kleur: "--carbs", targetKey: "maxKoolhydraten" as const },
  { key: "vet" as const, naam: "Vet", eenheid: "g", kleur: "--fat", targetKey: "maxVet" as const }
];

function pctOfTarget(dag: string, metric: (typeof TOTAAL_METRICS)[number]) {
  const target = targets.value[metric.targetKey];
  if (!target) return 0;
  return (dayTotals(dag)[metric.key] / target) * 100;
}

function totalTooltip(dag: string) {
  const totals = dayTotals(dag);
  return TOTAAL_METRICS.map((m) => {
    const target = Math.round(targets.value[m.targetKey]);
    const waarde = Math.round(totals[m.key]);
    const pct = Math.round(pctOfTarget(dag, m));
    return `${m.naam}: ${waarde}${m.eenheid} / ${target}${m.eenheid} (${pct}%)`;
  }).join("\n");
}

function categorieForMoment(moment: string) {
  return MEAL_MOMENTS.find((m) => m.key === moment)?.categorie;
}

function recipesForMoment(moment: string) {
  const categorie = categorieForMoment(moment);
  return recipes.value.filter((r) => r.categorie === categorie);
}

const filteredRecipes = computed(() => {
  if (!activeMoment.value) return [];
  const pool = recipesForMoment(activeMoment.value);
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter((r) => r.naam.toLowerCase().includes(q));
});

function momentRowLabel(moment: { key: string; label: string }) {
  if (moment.key === "tussendoor_1") return "Tussendoor 1";
  if (moment.key === "tussendoor_2") return "Tussendoor 2";
  return moment.label;
}

function dateForDag(dagKey: string) {
  const idx = WEEK_DAGEN.findIndex((d) => d.key === dagKey);
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + idx);
  return d;
}

function dayDate(dagKey: string) {
  return dateForDag(dagKey).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function isToday(dagKey: string) {
  return dateForDag(dagKey).toDateString() === new Date().toDateString();
}

function kokInitial(kokUserId?: string | null) {
  if (!kokUserId) return null;
  const m = householdMembers.value.find((x) => x.userId === kokUserId);
  return m ? m.naam.charAt(0).toUpperCase() : null;
}

function kokNaam(kokUserId?: string | null) {
  return householdMembers.value.find((x) => x.userId === kokUserId)?.naam ?? "";
}

async function loadWeek() {
  plan.value = await $fetch(`/api/weekplans/${isoDate(weekStart.value)}`);
}
async function loadRecipes() {
  // @ts-expect-error Nitro's typed $fetch route-matching hits TS's
  // "excessive stack depth" limit at our current route count (unrelated to
  // this specific call -- see other $fetch call sites for the same cast).
  // Works correctly at runtime; verified via curl.
  recipes.value = await $fetch("/api/recipes");
}
async function loadTargets() {
  targetProfiles.value = await $fetch("/api/targets" as any);
  const stored = localStorage.getItem("weekschema-active-profile");
  activeProfileId.value =
    stored && targetProfiles.value.some((t) => t.id === stored) ? stored : (targetProfiles.value[0]?.id ?? "");
}
async function loadHouseholdMembers() {
  householdMembers.value = await $fetch("/api/household/members" as any);
}

function onProfileChange() {
  localStorage.setItem("weekschema-active-profile", activeProfileId.value);
}

function toggleMode() {
  mode.value = mode.value === "edit" ? "saved" : "edit";
  localStorage.setItem("weekschema-mode", mode.value);
  closePopover();
}

function shiftWeek(delta: number) {
  closePopover();
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + delta * 7);
  weekStart.value = d;
  loadWeek();
}

function goToday() {
  closePopover();
  weekStart.value = mondayOf(new Date());
  loadWeek();
}

function slotFor(dag: string, moment: string) {
  return plan.value?.slots?.find((s: any) => s.dag === dag && s.mealMoment === moment);
}

function dayTotals(dag: string, excludeMoment?: string) {
  const totals = { kcal: 0, eiwit: 0, vet: 0, kh: 0 };
  for (const moment of MEAL_MOMENTS) {
    if (moment.key === excludeMoment) continue;
    const slot = slotFor(dag, moment.key);
    const recipe = slot?.recipe;
    if (!recipe) continue;
    const factor = 1 / recipe.porties;
    for (const ri of recipe.ingredients) {
      const g = ri.hoeveelheidGram * factor;
      totals.kcal += (ri.ingredient.kcalPer100g * g) / 100;
      totals.eiwit += (ri.ingredient.eiwitPer100g * g) / 100;
      totals.vet += (ri.ingredient.vetPer100g * g) / 100;
      totals.kh += (ri.ingredient.koolhydratenPer100g * g) / 100;
    }
  }
  return totals;
}

function dagLabel(dag: string) {
  return WEEK_DAGEN.find((d) => d.key === dag)?.label ?? dag;
}

// Kleur voor een cijfer in de Totaal-rij: de macro-kleur, of --destructive als
// de dag-doelen voor die dag al overschreden zijn.
function metricColor(dag: string, metric: "kcal" | "eiwit" | "kh" | "vet") {
  const totals = dayTotals(dag);
  const map = {
    kcal: { value: totals.kcal, max: targets.value.maxKcal, color: "--kcal" },
    eiwit: { value: totals.eiwit, max: targets.value.maxEiwit, color: "--protein" },
    kh: { value: totals.kh, max: targets.value.maxKoolhydraten, color: "--carbs" },
    vet: { value: totals.vet, max: targets.value.maxVet, color: "--fat" }
  }[metric];
  if (map.max > 0 && map.value > map.max) return "var(--destructive)";
  return `var(${map.color})`;
}

// Past dit recept nog binnen de dag-doelen, als het in plaats van wat er nu
// (eventueel) in dit vakje staat wordt gezet?
function fitsWithinTargets(dag: string, moment: string, recipe: any) {
  const base = dayTotals(dag, moment);
  const p = recipe.perPortie;
  return (
    base.kcal + p.kcal <= targets.value.maxKcal &&
    base.eiwit + p.eiwit <= targets.value.maxEiwit &&
    base.vet + p.vet <= targets.value.maxVet &&
    base.kh + p.kh <= targets.value.maxKoolhydraten
  );
}

function onDragOver(dag: string, moment: string) {
  if (mode.value !== "edit") return;
  dragOverKey.value = dag + moment;
}

function onDragLeave() {
  dragOverKey.value = null;
}

async function onDrop(dag: string, moment: string) {
  if (mode.value !== "edit") return;
  dragOverKey.value = null;
  if (!draggedRecipeId.value || !plan.value) return;
  const recipeId = draggedRecipeId.value;
  draggedRecipeId.value = null;
  const recipe = recipes.value.find((r) => r.id === recipeId);
  if (recipe && !(await confirmIfExceeds(dag, moment, recipe))) return;
  await setSlot(dag, moment, recipeId);
}

function onFilledClick(dag: string, moment: string) {
  if (mode.value === "saved") {
    openDetail(dag, moment);
  } else {
    openSearch(dag, moment);
  }
}

function openDetail(dag: string, moment: string) {
  const recipe = slotFor(dag, moment)?.recipe;
  if (recipe) detailRecipe.value = recipe;
}

async function onDetailUpdated() {
  await Promise.all([loadWeek(), loadRecipes()]);
  if (detailRecipe.value) {
    const fresh = recipes.value.find((r) => r.id === detailRecipe.value.id);
    if (fresh) detailRecipe.value = { ...detailRecipe.value, ...fresh };
  }
}

async function clearSlot(dag: string, moment: string) {
  await setSlot(dag, moment, null);
}

async function setSlot(dag: string, moment: string, recipeId: string | null) {
  await $fetch("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, recipeId }
  });
  await loadWeek();
}

async function editNotitie(dag: string, moment: string) {
  const current = slotFor(dag, moment)?.notitie ?? "";
  const value = prompt("Notitie voor dit vakje (leeg = geen notitie):", current);
  if (value === null) return;
  await $fetch("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, notitie: value }
  });
  await loadWeek();
}

async function cycleKok(dag: string, moment: string) {
  const currentId = slotFor(dag, moment)?.kokUserId ?? null;
  const ids: (string | null)[] = [null, ...householdMembers.value.map((m) => m.userId)];
  const idx = ids.indexOf(currentId);
  const nextId = ids[(idx + 1) % ids.length];
  await $fetch("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, kokUserId: nextId }
  });
  await loadWeek();
}

async function copyPreviousWeek() {
  const prevStart = new Date(weekStart.value);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevPlan = await $fetch<any>(`/api/weekplans/${isoDate(prevStart)}`);
  const filledPrev = prevPlan.slots.filter((s: any) => s.recipeId);
  if (!filledPrev.length) {
    alert("Vorige week heeft geen ingevulde vakjes om te kopiëren.");
    return;
  }

  const currentFilledCount = plan.value?.slots?.filter((s: any) => s.recipeId).length ?? 0;
  if (currentFilledCount > 0) {
    const ok = confirm(`Deze week heeft al ${currentFilledCount} ingevulde vakjes. Overschrijven met vorige week?`);
    if (!ok) return;
  }

  for (const slot of filledPrev) {
    await $fetch("/api/mealslots" as any, {
      method: "POST",
      body: { weekPlanId: plan.value.plan.id, dag: slot.dag, mealMoment: slot.mealMoment, recipeId: slot.recipeId }
    });
  }
  await loadWeek();
}

async function autoFillWeek() {
  if (!plan.value) return;
  const emptySlots: { dag: string; moment: string }[] = [];
  for (const dag of WEEK_DAGEN) {
    for (const moment of MEAL_MOMENTS) {
      if (!slotFor(dag.key, moment.key)?.recipeId) emptySlots.push({ dag: dag.key, moment: moment.key });
    }
  }
  if (!emptySlots.length) {
    alert("Alle vakjes zijn al ingevuld.");
    return;
  }
  const ok = confirm(`${emptySlots.length} lege vakjes automatisch vullen met suggesties binnen je macro-doelen?`);
  if (!ok) return;

  for (const { dag, moment } of emptySlots) {
    const candidates = recipesForMoment(moment);
    if (!candidates.length) continue;
    const fitting = candidates.filter((r) => fitsWithinTargets(dag, moment, r));
    const pick = randomRecipe(fitting.length ? fitting : candidates);
    if (!pick) continue;
    await setSlot(dag, moment, pick.id);
  }
}

function randomRecipe(list: any[]) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

// Vraagt bevestiging als dit recept de dag-doelen zou overschrijden.
// Geeft true terug als het recept toegevoegd mag worden (past, of gebruiker
// heeft toch bevestigd), false als het (nog) niet mag doorgaan.
async function confirmIfExceeds(dag: string, moment: string, recipe: any) {
  if (fitsWithinTargets(dag, moment, recipe)) return true;
  return confirm(
    `"${recipe.naam}" duwt ${dagLabel(dag)} over je macro-doelen heen. Toch toevoegen?`
  );
}

function openSearch(dag: string, moment: string) {
  activeCell.value = dag + "|" + moment;
  searchQuery.value = "";
}

function closePopover() {
  activeCell.value = null;
}

async function chooseRecipe(dag: string, moment: string, recipeId: string) {
  const recipe = recipes.value.find((r) => r.id === recipeId);
  if (recipe && !(await confirmIfExceeds(dag, moment, recipe))) return;
  await setSlot(dag, moment, recipeId);
  closePopover();
}

async function suggestRandom(dag: string, moment: string) {
  const categorieLabel = RECIPE_CATEGORIE_LABELS[categorieForMoment(moment) ?? ""];
  const candidates = recipesForMoment(moment);
  if (!candidates.length) {
    alert(`Er zijn nog geen "${categorieLabel}"-recepten om voor te stellen.`);
    return;
  }

  const fitting = candidates.filter((r) => fitsWithinTargets(dag, moment, r));
  if (fitting.length) {
    await setSlot(dag, moment, randomRecipe(fitting)!.id);
    return;
  }

  const pick = randomRecipe(candidates)!;
  const ok = confirm(
    `Geen enkel "${categorieLabel}"-recept past nog binnen je macro-doelen voor ${dagLabel(dag)}. Toch "${pick.naam}" toevoegen?`
  );
  if (!ok) return;
  await setSlot(dag, moment, pick.id);
}

async function suggestFromPopover(dag: string, moment: string) {
  const candidates = filteredRecipes.value;
  if (!candidates.length) {
    alert("Geen recepten gevonden om voor te stellen.");
    return;
  }

  const fitting = candidates.filter((r) => fitsWithinTargets(dag, moment, r));
  if (fitting.length) {
    await setSlot(dag, moment, randomRecipe(fitting)!.id);
    closePopover();
    return;
  }

  const pick = randomRecipe(candidates)!;
  const ok = confirm(
    `Geen van de gevonden recepten past nog binnen je macro-doelen voor ${dagLabel(dag)}. Toch "${pick.naam}" toevoegen?`
  );
  if (!ok) return;
  await setSlot(dag, moment, pick.id);
  closePopover();
}

onMounted(() => {
  const stored = localStorage.getItem("weekschema-mode");
  if (stored === "edit" || stored === "saved") mode.value = stored;
  loadWeek();
  loadRecipes();
  loadTargets();
  loadHouseholdMembers();
});
</script>
