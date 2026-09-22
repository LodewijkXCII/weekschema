<template>
  <div class="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
    <div class="flex-none border-b border-border bg-secondary/50 px-3 py-2.5 lg:px-4 lg:py-3">
      <p class="font-display text-base font-semibold lg:text-lg">{{ label }}</p>
    </div>

    <div v-if="mealSlot?.recipe" class="flex min-h-0 flex-1 cursor-pointer flex-col" @click="$emit('open', mealSlot.recipe)">
      <div class="min-h-0 flex-1 overflow-hidden">
        <RecipeThumb :recipe="mealSlot.recipe" fill />
      </div>
      <div class="flex-none p-3 lg:p-4">
        <p class="truncate text-base font-medium lg:text-lg" :title="mealSlot.recipe.naam">
          {{ mealSlot.recipe.naam }}
        </p>
        <p class="mt-1 text-sm tabular-nums text-muted-foreground">
          {{ Math.round(recipePerPortie(mealSlot.recipe).kcal) }} kcal
        </p>
        <p v-if="mealSlot.notitie" class="mt-1.5 flex items-start gap-1.5 text-sm text-accent">
          <StickyNote class="mt-0.5 size-4 shrink-0" /> {{ mealSlot.notitie }}
        </p>
        <p v-if="kok" class="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <User class="size-4 shrink-0" /> {{ kok }}
        </p>
      </div>
    </div>
    <div v-else class="flex flex-1 items-center justify-center p-3 text-center">
      <p class="text-sm text-muted-foreground/50">Nog niet gepland</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { StickyNote, User } from "lucide-vue-next";
import { recipePerPortie } from "~/composables/useMacros";

defineProps<{
  label: string;
  mealSlot: any | null;
  // Naam van wie er kookt, of "" als niemand is toegewezen.
  kok: string;
}>();
defineEmits<{ (e: "open", recipe: any): void }>();
</script>
