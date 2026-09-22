<template>
  <article class="group relative flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 transition-all hover:shadow-lift">
    <div class="w-12 shrink-0 overflow-hidden rounded-xl">
      <RecipeThumb :recipe="recipe" compact />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium group-hover:text-primary">{{ recipe.favoriet ? "★ " : "" }}{{ recipe.naam }}</p>
      <MacroSummary :macros="recipe.perPortie" class="mt-0.5" />
      <RecipeTags :tags="recipe.tags" class="mt-2" />
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{ recipe: any }>();
</script>
