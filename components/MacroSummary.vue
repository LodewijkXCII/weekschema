<template>
  <p class="text-xs tabular-nums text-muted-foreground">
    {{ Math.round(macros.kcal) }} kcal · <span style="color:var(--protein)">E {{ Math.round(macros.eiwit) }}g</span> ·
    <span style="color:var(--carbs)">K {{ Math.round(macros.kh) }}g</span> ·
    <span style="color:var(--fat)">V {{ Math.round(macros.vet) }}g</span>
  </p>
</template>

<script setup lang="ts">
import type { Macros } from "~/composables/useMacros";

defineProps<{ macros: Macros }>();
</script>
