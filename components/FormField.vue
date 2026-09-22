<template>
  <label class="block">
    <span class="text-xs font-medium text-muted-foreground">{{ label }}</span>
    <div class="mt-1">
      <slot />
    </div>
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>
