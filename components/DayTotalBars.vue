<template>
  <div class="flex flex-col items-center gap-1.5" :title="tooltip">
    <div class="flex h-9 items-end gap-[3px]">
      <div v-for="m in METRICS" :key="m.key" class="flex h-full w-2 items-end overflow-hidden rounded-sm bg-border">
        <div
          class="w-full rounded-t-sm transition-all"
          :style="{
            height: Math.min(100, pct(m)) + '%',
            background: pct(m) > 100 ? 'var(--destructive)' : `var(${m.kleur})`
          }"
        ></div>
      </div>
    </div>
    <div class="text-[11px] font-bold tabular-nums" :style="{ color: pct(METRICS[0]) > 100 ? 'var(--destructive)' : 'var(--kcal)' }">
      {{ Math.round(totals.kcal) }} kcal
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Macros } from "~/composables/useMacros";

const props = defineProps<{
  totals: Macros;
  targets: { maxKcal: number; maxEiwit: number; maxVet: number; maxKoolhydraten: number };
}>();

const METRICS = [
  { key: "kcal" as const, naam: "Kcal", eenheid: "", kleur: "--kcal", targetKey: "maxKcal" as const },
  { key: "eiwit" as const, naam: "Eiwit", eenheid: "g", kleur: "--protein", targetKey: "maxEiwit" as const },
  { key: "kh" as const, naam: "Koolhydraten", eenheid: "g", kleur: "--carbs", targetKey: "maxKoolhydraten" as const },
  { key: "vet" as const, naam: "Vet", eenheid: "g", kleur: "--fat", targetKey: "maxVet" as const }
];

// Percentage van het dag-doel; boven de 100% kleurt de balk rood.
function pct(metric: (typeof METRICS)[number]) {
  const target = props.targets[metric.targetKey];
  if (!target) return 0;
  return (props.totals[metric.key] / target) * 100;
}

const tooltip = computed(() =>
  METRICS.map((m) => {
    const target = Math.round(props.targets[m.targetKey]);
    const waarde = Math.round(props.totals[m.key]);
    return `${m.naam}: ${waarde}${m.eenheid} / ${target}${m.eenheid} (${Math.round(pct(m))}%)`;
  }).join("\n")
);
</script>
