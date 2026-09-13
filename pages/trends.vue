<template>
  <div class="mx-auto max-w-[760px] px-4 py-6 lg:px-6">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="bg-hero text-primary-foreground grid size-11 place-items-center rounded-2xl">
          <TrendingUp class="size-5" />
        </span>
        <h1 class="font-display text-2xl font-bold text-foreground">Trends</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <select v-model.number="weken" class="rounded-xl border border-border bg-card px-2 py-2 text-sm font-medium outline-none">
          <option :value="4">Laatste 4 weken</option>
          <option :value="8">Laatste 8 weken</option>
          <option :value="12">Laatste 12 weken</option>
          <option :value="26">Laatste 26 weken</option>
        </select>
        <select v-if="targetProfiles.length > 1" v-model="activeProfileId" class="rounded-xl border border-border bg-card px-2 py-2 text-sm font-medium outline-none">
          <option v-for="p in targetProfiles" :key="p.id" :value="p.id">{{ p.naam }}</option>
        </select>
        <NuxtLink to="/" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
          <ArrowLeft class="size-4" /> Terug naar weekbord
        </NuxtLink>
      </div>
    </header>

    <div v-if="loading" class="text-sm text-muted-foreground">Laden…</div>
    <div v-else-if="dagen.length === 0" class="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
      Nog geen ingevulde dagen in deze periode. Vul eerst een paar weken in op het weekbord.
    </div>

    <template v-else>
      <div v-for="metric in metrics" :key="metric.key" class="mb-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div class="mb-2 flex items-baseline justify-between">
          <p class="text-sm font-medium">{{ metric.label }}</p>
          <p class="text-xs text-muted-foreground">
            gemiddeld {{ Math.round(average(metric.key)) }}{{ metric.eenheid }} · doel {{ targetFor(metric.key) }}{{ metric.eenheid }}
          </p>
        </div>
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="block h-[120px] w-full" preserveAspectRatio="none">
          <line :x1="0" :x2="chartWidth" :y1="yForPct(100, metric.key)" :y2="yForPct(100, metric.key)" stroke="var(--muted-foreground)" stroke-width="1" stroke-dasharray="4 4" />
          <rect
            v-for="(d, i) in dagen"
            :key="i"
            :x="barX(i)"
            :y="yForPct(pctFor(d, metric.key), metric.key)"
            :width="barWidth"
            :height="chartHeight - yForPct(pctFor(d, metric.key), metric.key)"
            :fill="pctFor(d, metric.key) > 100 ? 'var(--destructive)' : metric.kleur"
            rx="1.5"
          >
            <title>{{ formatDatum(d.datum) }}: {{ Math.round(d[metric.key]) }}{{ metric.eenheid }} ({{ Math.round(pctFor(d, metric.key)) }}% van doel)</title>
          </rect>
        </svg>
        <p class="mt-0.5 text-[11px] text-muted-foreground">
          gestreepte lijn = 100% van je dagelijkse maximum · rood = over het doel die dag
        </p>
        <div class="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{{ formatDatum(dagen[0].datum) }}</span>
          <span>{{ formatDatum(dagen[dagen.length - 1].datum) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, ArrowLeft } from "lucide-vue-next";

interface DagTotaal { datum: string; kcal: number; eiwit: number; vet: number; kh: number }

const weken = ref(8);
const dagen = ref<DagTotaal[]>([]);
const loading = ref(true);
const targetProfiles = ref<any[]>([]);
const activeProfileId = ref("");

const chartWidth = 600;
const chartHeight = 120;

const metrics = [
  { key: "kcal" as const, label: "Kcal", eenheid: "", kleur: "var(--kcal)", targetKey: "maxKcal" as const },
  { key: "eiwit" as const, label: "Eiwit", eenheid: "g", kleur: "var(--protein)", targetKey: "maxEiwit" as const },
  { key: "kh" as const, label: "Koolhydraten", eenheid: "g", kleur: "var(--carbs)", targetKey: "maxKoolhydraten" as const },
  { key: "vet" as const, label: "Vet", eenheid: "g", kleur: "var(--fat)", targetKey: "maxVet" as const }
];

const activeTarget = computed(
  () =>
    targetProfiles.value.find((t) => t.id === activeProfileId.value) ??
    targetProfiles.value[0] ?? { maxKcal: 2000, maxEiwit: 120, maxVet: 70, maxKoolhydraten: 200 }
);

function targetFor(key: keyof DagTotaal) {
  const metric = metrics.find((m) => m.key === key)!;
  return Math.round(activeTarget.value[metric.targetKey]);
}

function average(key: "kcal" | "eiwit" | "vet" | "kh") {
  if (!dagen.value.length) return 0;
  return dagen.value.reduce((sum, d) => sum + d[key], 0) / dagen.value.length;
}

// Percentage van het dagelijkse maximum, zodat direct zichtbaar is hoe ver
// een dag van het doel af zit (100% = precies op het doel).
function pctFor(d: DagTotaal, key: "kcal" | "eiwit" | "vet" | "kh") {
  const target = targetFor(key);
  return target > 0 ? (d[key] / target) * 100 : 0;
}

// De schaal van de y-as: minstens tot 110%, of verder als een dag het doel
// flink overschrijdt, zodat die bar nooit buiten de grafiek valt.
function maxPctFor(key: "kcal" | "eiwit" | "vet" | "kh") {
  const values = dagen.value.map((d) => pctFor(d, key));
  return Math.max(...values, 100) * 1.1 || 110;
}

const colWidth = computed(() => (dagen.value.length ? chartWidth / dagen.value.length : chartWidth));
const barWidth = computed(() => Math.max(1, colWidth.value * 0.6));

function barX(i: number) {
  return i * colWidth.value + (colWidth.value - barWidth.value) / 2;
}

function yForPct(pct: number, key: "kcal" | "eiwit" | "vet" | "kh") {
  const maxPct = maxPctFor(key);
  return chartHeight - (Math.min(pct, maxPct) / maxPct) * chartHeight;
}

function formatDatum(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

async function loadTrends() {
  loading.value = true;
  dagen.value = await $fetch("/api/trends" as any, { params: { weken: weken.value } });
  loading.value = false;
}

async function loadTargets() {
  targetProfiles.value = await $fetch("/api/targets" as any);
  const stored = localStorage.getItem("weekschema-active-profile");
  activeProfileId.value =
    stored && targetProfiles.value.some((t) => t.id === stored) ? stored : (targetProfiles.value[0]?.id ?? "");
}

watch(weken, loadTrends);

onMounted(() => {
  loadTrends();
  loadTargets();
});
</script>
