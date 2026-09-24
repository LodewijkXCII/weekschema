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
        <TargetProfileSelect v-model="activeProfileId" :profiles="targetProfiles" />
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
        <StatCard label="Geplande dagen" :value="`${plannedDaysCount}/7`" />
        <StatCard label="Gerechten deze week" :value="totalDishesCount" />
        <StatCard label="Gem. kcal per dag" :value="avgKcalPerDay ?? '—'" />
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
                  <span class="text-xs font-normal tabular-nums text-muted-foreground">{{ formatDayDate(dateForDag(weekStart, dag.key)) }}</span>
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
                <MealSlotCell
                  :meal-slot="slotFor(dag.key, moment.key)"
                  :editable="mode === 'edit'"
                  :kok="kokNaam(slotFor(dag.key, moment.key)?.kokUserId)"
                  @open="onFilledClick(dag.key, moment.key)"
                  @search="openSearch(dag.key, moment.key)"
                  @suggest="suggestRandom(dag.key, moment.key)"
                  @notitie="editNotitie(dag.key, moment.key)"
                  @kok="cycleKok(dag.key, moment.key)"
                  @personen="editPersonen(dag.key, moment.key)"
                  @clear="clearSlot(dag.key, moment.key)"
                />

                <RecipeSearchPopover
                  v-if="mode === 'edit' && activeCell === dag.key + '|' + moment.key"
                  :recipes="recipesForMoment(moment.key)"
                  :ingredients="ingredients"
                  :categorie-label="RECIPE_CATEGORIE_LABELS[moment.categorie]"
                  :align-right="dag.key === 'zaterdag' || dag.key === 'zondag'"
                  :default-mode="popoverDefaultMode(dag.key, moment.key)"
                  @choose="chooseRecipe(dag.key, moment.key, $event)"
                  @choose-ingredient="chooseIngredient(dag.key, moment.key, $event)"
                  @suggest="suggestFromPopover(dag.key, moment.key, $event)"
                  @close="closePopover"
                />
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-border bg-secondary/30">
              <th class="sticky left-0 z-10 bg-secondary/30 p-3 text-left text-xs font-semibold text-muted-foreground">Totaal</th>
              <td v-for="dag in WEEK_DAGEN" :key="'total-' + dag.key" class="border-l border-border p-2">
                <DayTotalBars :totals="dayTotals(dag.key)" :targets="targets" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <div v-if="activeCell" class="fixed inset-0 z-10" @click="closePopover"></div>

    <RecipeLibrary v-if="mode === 'edit'" :recipes="recipes" class="mt-5" @dragstart="draggedRecipeId = $event" />

    <RecipeDetail :recipe="detailRecipe" @close="detailRecipe = null" @updated="onDetailUpdated" />
  </div>
</template>

<script setup lang="ts">
import {
  ChevronLeft, ChevronRight, CalendarDays, ShoppingCart, TrendingUp, Lock, Pencil, ClipboardCopy, Wand2
} from "lucide-vue-next";
import { MEAL_MOMENTS, WEEK_DAGEN, RECIPE_CATEGORIE_LABELS, momentRowLabel, defaultPersonen } from "~/composables/useMealMoments";
import { mondayOf, isoDate, formatWeekDate, weekStartFromQuery, dateForDag, formatDayDate } from "~/composables/useWeek";
import { emptyMacros, slotMacros, isSlotFilled, ingredientMacros, type Macros } from "~/composables/useMacros";
import { eenheidNaarGram, type IngredientUnitKey } from "~/composables/useIngredientUnits";
import { useTargetProfiles } from "~/composables/useTargetProfiles";

const route = useRoute();

const weekStart = ref(weekStartFromQuery(route.query.week));
const plan = ref<any>(null);
const recipes = ref<any[]>([]);
const ingredients = ref<any[]>([]);
const householdMembers = ref<{ userId: string; naam: string }[]>([]);
const draggedRecipeId = ref<string | null>(null);
const dragOverKey = ref<string | null>(null);

const mode = ref<"edit" | "saved">("edit");
const detailRecipe = ref<any | null>(null);

const activeCell = ref<string | null>(null);

const { targetProfiles, activeProfileId, targets, loadTargets } = useTargetProfiles();

const plannedDaysCount = computed(
  () => WEEK_DAGEN.filter((dag) => MEAL_MOMENTS.some((m) => isSlotFilled(slotFor(dag.key, m.key)))).length
);

const totalDishesCount = computed(() =>
  WEEK_DAGEN.reduce((sum, dag) => sum + MEAL_MOMENTS.filter((m) => isSlotFilled(slotFor(dag.key, m.key))).length, 0)
);

const avgKcalPerDay = computed(() => {
  const withData = WEEK_DAGEN.filter((dag) => MEAL_MOMENTS.some((m) => isSlotFilled(slotFor(dag.key, m.key))));
  if (!withData.length) return null;
  const total = withData.reduce((sum, dag) => sum + dayTotals(dag.key).kcal, 0);
  return Math.round(total / withData.length);
});

function categorieForMoment(moment: string) {
  return MEAL_MOMENTS.find((m) => m.key === moment)?.categorie;
}

function recipesForMoment(moment: string) {
  const categorie = categorieForMoment(moment);
  return recipes.value.filter((r) => r.categorie === categorie);
}

function isToday(dagKey: string) {
  return dateForDag(weekStart.value, dagKey).toDateString() === new Date().toDateString();
}

function kokNaam(kokUserId?: string | null) {
  if (!kokUserId) return "";
  return householdMembers.value.find((x) => x.userId === kokUserId)?.naam ?? "";
}

async function loadWeek() {
  plan.value = await $fetch(`/api/weekplans/${isoDate(weekStart.value)}`);
}
async function loadRecipes() {
  recipes.value = await $fetch<any[]>("/api/recipes" as any);
}
async function loadIngredients() {
  ingredients.value = await $fetch<any[]>("/api/ingredients" as any);
}
async function loadHouseholdMembers() {
  householdMembers.value = await $fetch<any[]>("/api/household/members" as any);
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
  const totals = emptyMacros();
  for (const moment of MEAL_MOMENTS) {
    if (moment.key === excludeMoment) continue;
    const p = slotMacros(slotFor(dag, moment.key));
    totals.kcal += p.kcal;
    totals.eiwit += p.eiwit;
    totals.vet += p.vet;
    totals.kh += p.kh;
  }
  return totals;
}

function dagLabel(dag: string) {
  return WEEK_DAGEN.find((d) => d.key === dag)?.label ?? dag;
}

// Past dit recept (of los ingrediënt) met macro's `p` nog binnen de
// dag-doelen, als het in plaats van wat er nu (eventueel) in dit vakje staat
// wordt gezet?
function fitsWithinTargets(dag: string, moment: string, p: Macros) {
  const base = dayTotals(dag, moment);
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
  if (recipe && !(await confirmIfExceeds(dag, moment, recipe.naam, recipe.perPortie))) return;
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
  await $fetch<any>("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, recipeId: null, ingredient: null }
  });
  await loadWeek();
}

async function setSlot(dag: string, moment: string, recipeId: string | null) {
  await $fetch<any>("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, recipeId }
  });
  await loadWeek();
}

async function editNotitie(dag: string, moment: string) {
  const current = slotFor(dag, moment)?.notitie ?? "";
  const value = prompt("Notitie voor dit vakje (leeg = geen notitie):", current);
  if (value === null) return;
  await $fetch<any>("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, notitie: value }
  });
  await loadWeek();
}

async function editPersonen(dag: string, moment: string) {
  const slot = slotFor(dag, moment);
  if (!slot) return;
  const standaard = defaultPersonen(slot);
  const value = prompt(
    `Met hoeveel personen eten jullie dit? (stapjes van 0,5; leeg = standaard ${standaard.toLocaleString("nl")})`,
    slot.personen != null ? slot.personen.toLocaleString("nl") : ""
  );
  if (value === null) return;
  let personen: number | null = null;
  if (value.trim()) {
    personen = Number(value.trim().replace(",", "."));
    if (!(personen > 0) || !Number.isInteger(personen * 2)) {
      alert("Vul een aantal in stapjes van 0,5 in (bv. 2 of 2,5).");
      return;
    }
  }
  await $fetch<any>("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, personen }
  });
  await loadWeek();
}

async function cycleKok(dag: string, moment: string) {
  const currentId = slotFor(dag, moment)?.kokUserId ?? null;
  const ids: (string | null)[] = [null, ...householdMembers.value.map((m) => m.userId)];
  const idx = ids.indexOf(currentId);
  const nextId = ids[(idx + 1) % ids.length];
  await $fetch<any>("/api/mealslots" as any, {
    method: "POST",
    body: { weekPlanId: plan.value.plan.id, dag, mealMoment: moment, kokUserId: nextId }
  });
  await loadWeek();
}

async function copyPreviousWeek() {
  const prevStart = new Date(weekStart.value);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevPlan = await $fetch<any>(`/api/weekplans/${isoDate(prevStart)}`);
  const filledPrev = prevPlan.slots.filter(isSlotFilled);
  if (!filledPrev.length) {
    alert("Vorige week heeft geen ingevulde vakjes om te kopiëren.");
    return;
  }

  const currentFilledCount = plan.value?.slots?.filter(isSlotFilled).length ?? 0;
  if (currentFilledCount > 0) {
    const ok = confirm(`Deze week heeft al ${currentFilledCount} ingevulde vakjes. Overschrijven met vorige week?`);
    if (!ok) return;
  }

  for (const slot of filledPrev) {
    await $fetch<any>("/api/mealslots" as any, {
      method: "POST",
      body: {
        weekPlanId: plan.value.plan.id,
        dag: slot.dag,
        mealMoment: slot.mealMoment,
        personen: slot.personen ?? null,
        ...(slot.recipeId
          ? { recipeId: slot.recipeId }
          : {
              ingredient: {
                ingredientId: slot.ingredientId,
                hoeveelheid: slot.ingredientHoeveelheid,
                eenheid: slot.ingredientEenheid
              }
            })
      }
    });
  }
  await loadWeek();
}

async function autoFillWeek() {
  if (!plan.value) return;
  const emptySlots: { dag: string; moment: string }[] = [];
  for (const dag of WEEK_DAGEN) {
    for (const moment of MEAL_MOMENTS) {
      if (!isSlotFilled(slotFor(dag.key, moment.key))) emptySlots.push({ dag: dag.key, moment: moment.key });
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
    const fitting = candidates.filter((r) => fitsWithinTargets(dag, moment, r.perPortie));
    const pick = randomRecipe(fitting.length ? fitting : candidates);
    if (!pick) continue;
    await setSlot(dag, moment, pick.id);
  }
}

function randomRecipe(list: any[]) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

// Vraagt bevestiging als dit recept/ingrediënt de dag-doelen zou
// overschrijden. Geeft true terug als het toegevoegd mag worden (past, of
// gebruiker heeft toch bevestigd), false als het (nog) niet mag doorgaan.
async function confirmIfExceeds(dag: string, moment: string, naam: string, p: Macros) {
  if (fitsWithinTargets(dag, moment, p)) return true;
  return confirm(
    `"${naam}" duwt ${dagLabel(dag)} over je macro-doelen heen. Toch toevoegen?`
  );
}

function openSearch(dag: string, moment: string) {
  activeCell.value = dag + "|" + moment;
}

// Tussendoortjes zijn meestal één los ingrediënt (handje noten, een
// Breaker), dus daar opent de popover meteen op "Ingrediënt" -- tenzij er
// al een recept in het vakje staat.
function popoverDefaultMode(dag: string, moment: string) {
  const slot = slotFor(dag, moment);
  if (slot?.recipeId) return "recept";
  if (slot?.ingredientId) return "ingredient";
  return categorieForMoment(moment) === "tussendoor" ? "ingredient" : "recept";
}

function closePopover() {
  activeCell.value = null;
}

async function chooseRecipe(dag: string, moment: string, recipe: any) {
  if (!(await confirmIfExceeds(dag, moment, recipe.naam, recipe.perPortie))) return;
  await setSlot(dag, moment, recipe.id);
  closePopover();
}

async function chooseIngredient(
  dag: string,
  moment: string,
  { ingredient, hoeveelheid, eenheid }: { ingredient: any; hoeveelheid: number; eenheid: IngredientUnitKey }
) {
  const gram = eenheidNaarGram(hoeveelheid, eenheid, ingredient.gramPerStuk);
  if (!(await confirmIfExceeds(dag, moment, ingredient.naam, ingredientMacros(ingredient, gram)))) return;
  await $fetch<any>("/api/mealslots" as any, {
    method: "POST",
    body: {
      weekPlanId: plan.value.plan.id,
      dag,
      mealMoment: moment,
      ingredient: { ingredientId: ingredient.id, hoeveelheid, eenheid }
    }
  });
  await loadWeek();
  closePopover();
}

async function suggestRandom(dag: string, moment: string) {
  const categorieLabel = RECIPE_CATEGORIE_LABELS[categorieForMoment(moment) ?? ""];
  const candidates = recipesForMoment(moment);
  if (!candidates.length) {
    alert(`Er zijn nog geen "${categorieLabel}"-recepten om voor te stellen.`);
    return;
  }

  const fitting = candidates.filter((r) => fitsWithinTargets(dag, moment, r.perPortie));
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

async function suggestFromPopover(dag: string, moment: string, candidates: any[]) {
  if (!candidates.length) {
    alert("Geen recepten gevonden om voor te stellen.");
    return;
  }

  const fitting = candidates.filter((r) => fitsWithinTargets(dag, moment, r.perPortie));
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
  loadIngredients();
  loadTargets();
  loadHouseholdMembers();
});
</script>
