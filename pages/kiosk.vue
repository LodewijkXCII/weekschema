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
        <KioskMomentCard
          v-for="moment in MEAL_MOMENTS"
          :key="moment.key"
          :label="momentRowLabel(moment)"
          :meal-slot="activeSlot(moment.key)"
          :kok="kokNaam(moment.key)"
          @open="detailRecipe = $event"
        />
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
            <p class="mt-1 text-sm font-bold tabular-nums lg:text-base">{{ formatDayDate(dateForDag(weekStart, dag.key)) }}</p>
            <div class="mt-1.5 flex justify-center gap-1">
              <span
                v-for="m in MEAL_MOMENTS"
                :key="m.key"
                class="size-1.5 rounded-full lg:size-2"
                :class="isSlotFilled(slotForDag(dag.key, m.key)) ? 'bg-primary' : 'bg-border'"
              ></span>
            </div>
          </button>
        </div>
      </div>
    </template>

    <RecipeDetail :recipe="detailRecipe" @close="detailRecipe = null" @updated="onDetailUpdated" />
  </div>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";
import { MEAL_MOMENTS, WEEK_DAGEN, momentRowLabel } from "~/composables/useMealMoments";
import { mondayOf, isoDate, dateForDag, formatDayDate } from "~/composables/useWeek";
import { isSlotFilled } from "~/composables/useMacros";

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
const detailRecipe = ref<any | null>(null);
const clock = ref(formatClock());
const huidigeDatum = ref(isoDate(new Date()));

function formatClock() {
  return new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

async function loadWeek() {
  plan.value = await $fetch(`/api/weekplans/${isoDate(weekStart.value)}`);
}
async function loadHouseholdMembers() {
  householdMembers.value = await $fetch<any[]>("/api/household/members" as any);
}

// Na een wijziging in het detail-paneel (favoriet, duimpje, foto) het
// weekplan opnieuw ophalen zodat de tegel meteen klopt, en het open paneel
// zelf ook verversen met de nieuwe waarden (blijft anders op de oude data
// staan tot je 'm sluit en opnieuw opent).
async function onDetailUpdated() {
  await loadWeek();
  if (!detailRecipe.value) return;
  for (const slot of plan.value?.slots ?? []) {
    if (slot.recipe?.id === detailRecipe.value.id) {
      detailRecipe.value = slot.recipe;
      break;
    }
  }
}

function slotForDag(dag: string, moment: string) {
  return plan.value?.slots?.find((s: any) => s.dag === dag && s.mealMoment === moment);
}

function activeSlot(moment: string) {
  return slotForDag(selectedDag.value, moment);
}

function kokNaam(moment: string) {
  const kokUserId = activeSlot(moment)?.kokUserId;
  if (!kokUserId) return "";
  return householdMembers.value.find((m) => m.userId === kokUserId)?.naam ?? "";
}

const dagLabel = computed(() => WEEK_DAGEN.find((d) => d.key === selectedDag.value)?.label ?? "");
const dateLabel = computed(() =>
  dateForDag(weekStart.value, selectedDag.value).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
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
