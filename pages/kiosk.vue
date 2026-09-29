<template>
  <!-- Mobiel: alles onder elkaar en de pagina zelf scrollt (met de dagkeuze
       vast onderin). Vanaf md: het vaste tabletscherm zonder scrollen. -->
  <div ref="scroller" class="flex h-full flex-col overflow-y-auto p-4 md:overflow-hidden md:p-6 lg:p-8">
    <header class="mb-4 flex flex-none items-center justify-between gap-3 md:mb-5">
      <div class="min-w-0">
        <p class="font-display text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">{{ dagLabel }}</p>
        <p class="mt-0.5 text-sm text-muted-foreground md:mt-1 md:text-base lg:text-lg">{{ dateLabel }}</p>
      </div>
      <div class="flex items-center gap-2 md:gap-4">
        <div class="text-right">
          <p class="font-display text-3xl font-bold tabular-nums text-foreground md:text-4xl lg:text-5xl">{{ clock }}</p>
          <p class="hidden text-xs text-muted-foreground md:block lg:text-sm">ververst automatisch</p>
        </div>
        <button
          type="button"
          :title="theme === 'dark' ? 'Licht thema' : 'Donker thema'"
          class="grid size-10 flex-none place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground md:size-12"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" class="size-5 md:size-6" />
          <Moon v-else class="size-5 md:size-6" />
        </button>
        <NuxtLink to="/" class="grid size-10 flex-none place-items-center rounded-2xl border border-border bg-card text-muted-foreground no-underline transition-colors hover:text-foreground md:size-12">
          <X class="size-5 md:size-6" />
        </NuxtLink>
      </div>
    </header>

    <div v-if="!plan" class="flex flex-1 items-center justify-center text-lg text-muted-foreground">Laden…</div>

    <template v-else>
      <div class="flex flex-col gap-3 md:grid md:min-h-0 md:flex-1 md:grid-cols-5 lg:gap-4">
        <KioskMomentCard
          v-for="moment in MEAL_MOMENTS"
          :key="moment.key"
          :data-moment="moment.key"
          class="h-72 flex-none scroll-mt-4 md:h-auto"
          :label="momentRowLabel(moment)"
          :meal-slot="activeSlot(moment.key)"
          :kok="kokNaam(moment.key)"
          :current="isTodaySelected && moment.key === huidigMoment"
          @open="detailRecipe = $event"
        />
      </div>

      <div class="sticky bottom-0 -mx-4 mt-3 flex-none bg-background/95 px-4 pt-2 pb-1 backdrop-blur md:static md:mx-0 md:mt-4 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div class="grid grid-cols-7 gap-1.5 md:gap-2 lg:gap-3">
          <button
            v-for="dag in WEEK_DAGEN"
            :key="dag.key"
            type="button"
            class="rounded-2xl border px-1 py-2 text-center transition-colors md:py-3 lg:py-4"
            :class="dag.key === selectedDag ? 'border-primary bg-primary/10' : 'border-border bg-card'"
            @click="selectedDag = dag.key"
          >
            <p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:text-sm">{{ dag.label.slice(0, 2) }}</p>
            <p class="mt-1 text-sm font-bold tabular-nums lg:text-base">{{ formatDayDate(dateForDag(weekStart, dag.key)) }}</p>
            <div class="mt-1.5 flex justify-center gap-0.5 md:gap-1">
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
import { X, Sun, Moon } from "lucide-vue-next";
import { MEAL_MOMENTS, WEEK_DAGEN, momentRowLabel, currentMomentKey } from "~/composables/useMealMoments";
import { mondayOf, isoDate, dateForDag, formatDayDate } from "~/composables/useWeek";
import { isSlotFilled } from "~/composables/useMacros";

definePageMeta({ layout: "kiosk" });

const { theme, toggle: toggleTheme } = useKioskTheme();

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
const huidigMoment = ref(currentMomentKey());
const scroller = ref<HTMLElement | null>(null);

// huidigeDatum staat erin zodat dit na middernacht opnieuw wordt berekend.
const isTodaySelected = computed(() => selectedDag.value === todayDagKey() && huidigeDatum.value === isoDate(new Date()));

// Op mobiel staan de momenten onder elkaar: scroll dan naar het eetmoment
// dat nu aan de beurt is (op basis van de tijd, zie MOMENT_VANAF_UUR), of
// naar boven als je een andere dag bekijkt. Op tablet/desktop past alles al
// in beeld, dus daar niets doen.
function scrollToCurrentMoment() {
  if (!window.matchMedia("(max-width: 767px)").matches) return;
  nextTick(() => {
    if (!isTodaySelected.value) {
      scroller.value?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scroller.value
      ?.querySelector(`[data-moment="${huidigMoment.value}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

watch(selectedDag, scrollToCurrentMoment);

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
  loadWeek().then(scrollToCurrentMoment);
  loadHouseholdMembers();

  // Klok elke seconde bijwerken, en elke minuut checken of de kalenderdag
  // (of week) inmiddels is omgeslagen -- dit scherm blijft dagenlang open
  // op een gemonteerde tablet, dus moet zichzelf zonder ingrijpen bijhouden.
  clockInterval = setInterval(() => {
    clock.value = formatClock();
    const moment = currentMomentKey();
    if (moment !== huidigMoment.value) {
      huidigMoment.value = moment;
      scrollToCurrentMoment();
    }
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
