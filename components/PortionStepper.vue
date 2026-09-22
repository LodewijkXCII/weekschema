<template>
  <div class="flex items-center gap-1.5">
    <button type="button" class="grid size-7 place-items-center rounded-lg border border-border hover:bg-secondary" @click="adjust(-step)">
      <Minus class="size-3.5" />
    </button>
    <input type="number" :step="step" :min="step" v-model.number="model" class="w-16 rounded-lg border border-border bg-background px-1 py-1 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
    <button type="button" class="grid size-7 place-items-center rounded-lg border border-border hover:bg-secondary" @click="adjust(step)">
      <Plus class="size-3.5" />
    </button>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Minus, Plus } from "lucide-vue-next";

// Getal-invoer met -/+ knoppen, afgerond op veelvouden van `step` (standaard
// 0,5 -- handig voor een halve kinderportie) en nooit lager dan één stap.
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0.5 });
const model = defineModel<number>({ required: true });

function adjust(delta: number) {
  const next = (model.value ?? props.step) + delta;
  model.value = Math.max(props.step, Math.round(next / props.step) * props.step);
}
</script>
