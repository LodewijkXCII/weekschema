<template>
  <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <span class="bg-hero text-primary-foreground grid size-11 place-items-center rounded-2xl">
        <component :is="icon" class="size-5" />
      </span>
      <div>
        <h1 class="font-display text-2xl font-bold text-foreground">{{ title }}</h1>
        <p v-if="subtitle || $slots.subtitle" class="text-sm text-muted-foreground">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Component } from "vue";

defineProps<{ icon: Component; title: string; subtitle?: string }>();
</script>
