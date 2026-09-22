<template>
  <div class="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
    <div class="text-xs font-medium text-muted-foreground">{{ label }}</div>
    <div class="font-display text-xl font-bold tabular-nums">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number }>();
</script>
