<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
    :class="active ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ active?: boolean }>();
</script>
