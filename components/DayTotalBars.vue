<template>
  <!-- inline: één regel per macro (naam | balk | waarde/doel | %), voor een
       brede plek zoals de dagweergave op mobiel.
       stacked: naam + % boven de balk en waarde/doel eronder, voor een smalle
       kolom zoals de Totaal-rij van de weektabel. -->
  <div v-if="variant === 'inline'" class="space-y-2">
    <div v-for="m in rows" :key="m.key" class="flex items-center gap-2.5 text-xs tabular-nums">
      <span class="w-12 flex-none font-semibold" :style="{ color: `var(${m.kleur})` }">{{ m.naam }}</span>
      <div class="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
        <div class="h-full rounded-full transition-all" :style="barStyle(m)"></div>
      </div>
      <span class="flex-none text-muted-foreground">
        <span class="font-semibold text-foreground">{{ m.waarde }}</span> / {{ m.doel }}{{ m.eenheid }}
      </span>
      <span class="w-10 flex-none text-right font-bold" :class="m.pct > 100 ? 'text-destructive' : ''">{{ m.pct }}%</span>
    </div>
  </div>
  <div v-else class="space-y-2">
    <div v-for="m in rows" :key="m.key" class="text-[11px] tabular-nums">
      <div class="flex items-baseline justify-between gap-1">
        <span class="font-semibold" :style="{ color: `var(${m.kleur})` }">{{ m.naam }}</span>
        <span class="font-bold" :class="m.pct > 100 ? 'text-destructive' : ''">{{ m.pct }}%</span>
      </div>
      <div class="mt-0.5 h-1.5 overflow-hidden rounded-full bg-border">
        <div class="h-full rounded-full transition-all" :style="barStyle(m)"></div>
      </div>
      <div class="mt-0.5 text-muted-foreground">
        <span class="font-semibold text-foreground">{{ m.waarde }}</span> / {{ m.doel }}{{ m.eenheid }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Macros } from "~/composables/useMacros";

const props = withDefaults(
  defineProps<{
    totals: Macros;
    targets: { maxKcal: number; maxEiwit: number; maxVet: number; maxKoolhydraten: number };
    variant?: "stacked" | "inline";
  }>(),
  { variant: "stacked" }
);

const METRICS = [
  { key: "kcal" as const, naam: "Kcal", eenheid: "", kleur: "--kcal", targetKey: "maxKcal" as const },
  { key: "eiwit" as const, naam: "Eiwit", eenheid: "g", kleur: "--protein", targetKey: "maxEiwit" as const },
  { key: "kh" as const, naam: "Koolh.", eenheid: "g", kleur: "--carbs", targetKey: "maxKoolhydraten" as const },
  { key: "vet" as const, naam: "Vet", eenheid: "g", kleur: "--fat", targetKey: "maxVet" as const }
];

// Percentage van het dag-doel; boven de 100% kleurt de balk rood.
const rows = computed(() =>
  METRICS.map((m) => {
    const target = props.targets[m.targetKey];
    return {
      ...m,
      waarde: Math.round(props.totals[m.key]),
      doel: Math.round(target),
      pct: target ? Math.round((props.totals[m.key] / target) * 100) : 0
    };
  })
);

function barStyle(m: (typeof rows.value)[number]) {
  return {
    width: Math.min(100, m.pct) + "%",
    background: m.pct > 100 ? "var(--destructive)" : `var(${m.kleur})`
  };
}
</script>
