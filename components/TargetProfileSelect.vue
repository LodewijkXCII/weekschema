<template>
  <select
    v-if="profiles.length > 1"
    v-model="model"
    class="rounded-xl border border-border bg-card px-2 py-2 text-sm font-medium outline-none"
  >
    <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.naam }}</option>
  </select>
</template>

<script setup lang="ts">
defineProps<{ profiles: any[] }>();
const model = defineModel<string>({ required: true });
</script>
