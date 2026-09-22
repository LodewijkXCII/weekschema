<template>
  <div class="relative">
    <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
    <input v-model="model" :placeholder="placeholder" class="form-input py-2.5 pl-9" />
  </div>
</template>

<script setup lang="ts">
import { Search } from "lucide-vue-next";

defineProps<{ placeholder?: string }>();
const model = defineModel<string>({ required: true });
</script>
