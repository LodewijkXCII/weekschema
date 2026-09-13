<template>
  <div class="flex h-full flex-col p-6 lg:p-8">
    <header class="mb-5 flex flex-none items-center justify-between">
      <div>
        <p class="font-display text-3xl font-bold text-foreground lg:text-4xl">{{ dagLabel }}</p>
        <p class="mt-1 text-base text-muted-foreground lg:text-lg">{{ dateLabel }}</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="font-display text-4xl font-bold tabular-nums text-foreground lg:text-5xl">{{ clock }}</p>
          <p class="text-xs text-muted-foreground lg:text-sm">ververst automatisch</p>
        </div>
        <NuxtLink to="/" class="grid size-12 flex-none place-items-center rounded-2xl border border-border bg-card text-muted-foreground no-underline transition-colors hover:text-foreground">
          <X class="size-6" />
        </NuxtLink>
      </div>
    </header>

    <div v-if="!plan" class="flex flex-1 items-center justify-center text-lg text-muted-foreground">Laden…</div>

    <template v-else>
      <div class="grid min-h-0 flex-1 grid-cols-5 gap-3 lg:gap-4">
        <div v-for="moment in MEAL_MOMENTS" :key="moment.key" class="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div class="flex-none border-b border-border bg-secondary/50 px-3 py-2.5 lg:px-4 lg:py-3">
            <p class="font-display text-base font-semibold lg:text-lg">{{ momentRowLabel(moment) }}</p>
          </div>

          <div v-if="activeSlot(moment.key)?.recipe" class="flex min-h-0 flex-1 flex-col">
            <div class="min-h-0 flex-1 overflow-hidden">
              <RecipeThumb :recipe="activeSlot(moment.key)!.recipe!" fill />
            </div>
            <div class="flex-none p-3 lg:p-4">
              <p class="truncate text-base font-medium lg:text-lg" :title="activeSlot(moment.key)!.recipe!.naam">
                {{ activeSlot(moment.key)!.recipe!.naam }}
              </p>
              <p class="mt-1 text-sm tabular-nums text-muted-foreground">
                {{ perPortieKcal(activeSlot(moment.key)!.recipe!) }} kcal
              </p>
              <p v-if="activeSlot(moment.key)?.notitie" class="mt-1.5 flex items-start gap-1.5 text-sm text-accent">
                <StickyNote class="mt-0.5 size-4 shrink-0" /> {{ activeSlot(moment.key)?.notitie }}
              </p>
              <p v-if="kokNaam(moment.key)" class="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <User class="size-4 shrink-0" /> {{ kokNaam(moment.key) }}
              </p>
            </div>
          </div>
          <div v-else class="flex flex-1 items-center justify-center p-3 text-center">
            <p class="text-sm text-muted-foreground/50">Nog niet gepland</p>
          </div>
        </div>
      </div>

      <div class="mt-4 flex-none">
        <div class="grid grid-cols-7 gap-2 lg:gap-3">
          <button
            v-for="dag in WEEK_DAGEN"
            :key="dag.key"
            type="button"
            class="rounded-2xl border px-1 py-3 text-center transition-colors lg:py-4"
            :class="dag.key === selectedDag ? 'border-primary bg-primary/10' : 'border-border bg-card'"
            @click="selectedDag = dag.key"
          >
            <p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:text-sm">{{ dag.label.slice(0, 2) }}</p>
            <p class="mt-1 text-sm font-bold tabular-nums lg:text-base">{{ dayDate(dag.key) }}</p>
            <div class="mt-1.5 flex justify-center gap-1">
              <span
                v-for="m in MEAL_MOMENTS"
                :key="m.key"
                class="size-1.5 rounded-full lg:size-2"
                :class="slotForDag(dag.key, m.key)?.recipeId ? 'bg-primary' : 'bg-border'"
              ></span>
            </div>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { X, StickyNote, User } from "lucide-vue-next";
import { MEAL_MOMENTS, WEEK_DAGEN } from "~/composables/useMealMoments";
import { mondayOf, isoDate } from "~/composables/useWeek";

definePageMeta({ layout: "kiosk" });

// Elke dag van de week is een eigen letterlijke sleutel (geen datum-diff),
// dus "vandaag" bepalen we via JS' eigen getDay() los van WEEK_DAGEN.
const DAG_VOOR_JS_DAY = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"] as const;

function todayDagKey() {
  return DAG_VOOR_JS_DAY[new Date().getDay()];
}

const weekStart = ref(mondayOf(new Date()));
const selectedDag = ref<string>(todayDagKey());
const plan = ref<any>(null);
const householdMembers = ref<{ userId: string; naam: string }[]>([]);
const clock = ref(formatClock());
const huidigeDatum = ref(isoDate(new Date()));

function formatClock() {
  return new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

async function loadWeek() {
  plan.value = await $fetch(`/api/weekplans/${isoDate(weekStart.value)}`);
}
async function loadHouseholdMembers() {
  householdMembers.value = await $fetch("/api/household/members" as any);
}

function slotForDag(dag: string, moment: string) {
  return plan.value?.slots?.find((s: any) => s.dag === dag && s.mealMoment === moment);
}

function activeSlot(moment: string) {
  return slotForDag(selectedDag.value, moment);
}

// De weekplan-API rekent geen perPortie voor (dat doet alleen de recepten-
// lijst-API) -- de slots hier bevatten enkel de rauwe ingrediënten, dus
// rekenen we per-portie kcal hier zelf uit, net als dayTotals() op het
// weekbord (pages/index.vue).
function perPortieKcal(recipe: any) {
  let kcal = 0;
  for (const ri of recipe.ingredients ?? []) {
    kcal += (ri.ingredient.kcalPer100g * ri.hoeveelheidGram) / 100;
  }
  return Math.round(kcal / (recipe.porties || 1));
}

function kokNaam(moment: string) {
  const kokUserId = activeSlot(moment)?.kokUserId;
  if (!kokUserId) return "";
  return householdMembers.value.find((m) => m.userId === kokUserId)?.naam ?? "";
}

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

const dagLabel = computed(() => WEEK_DAGEN.find((d) => d.key === selectedDag.value)?.label ?? "");
const dateLabel = computed(() =>
  dateForDag(selectedDag.value).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
);

let clockInterval: ReturnType<typeof setInterval> | undefined;
let refreshInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  loadWeek();
  loadHouseholdMembers();

  // Klok elke seconde bijwerken, en elke minuut checken of de kalenderdag
  // (of week) inmiddels is omgeslagen -- dit scherm blijft dagenlang open
  // op een gemonteerde tablet, dus moet zichzelf zonder ingrijpen bijhouden.
  clockInterval = setInterval(() => {
    clock.value = formatClock();
    const nu = isoDate(new Date());
    if (nu !== huidigeDatum.value) {
      huidigeDatum.value = nu;
      selectedDag.value = todayDagKey();
      const nieuweWeekStart = mondayOf(new Date());
      if (isoDate(nieuweWeekStart) !== isoDate(weekStart.value)) {
        weekStart.value = nieuweWeekStart;
        loadWeek();
      }
    }
  }, 1000);

  // Periodiek herladen zodat wijzigingen vanaf een ander toestel (telefoon,
  // laptop) ook op het passief draaiende kiosk-scherm doorkomen.
  refreshInterval = setInterval(loadWeek, 2 * 60 * 1000);
});

onUnmounted(() => {
  clearInterval(clockInterval);
  clearInterval(refreshInterval);
});
</script>
