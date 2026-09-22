<template>
  <div v-if="tags?.length" class="flex flex-wrap gap-1">
    <span v-for="t in tags" :key="t" class="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">#{{ t }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tags?: string[] | null }>();
</script>
