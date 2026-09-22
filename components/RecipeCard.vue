<template>
  <article class="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:shadow-lift">
    <RecipeThumb :recipe="recipe" />
    <div class="p-3">
      <p class="flex items-center gap-1 truncate text-sm font-medium">
        <Star v-if="recipe.favoriet" class="size-3.5 shrink-0 text-accent" fill="currentColor" />
        {{ recipe.naam }}
      </p>
      <span class="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground uppercase">{{ RECIPE_CATEGORIE_LABELS[recipe.categorie] }}</span>
      <RecipeTags :tags="recipe.tags" class="mt-1.5" />
      <p class="mt-2 text-xs text-muted-foreground">{{ recipe.porties }} portie(s)</p>
      <MacroSummary :macros="recipe.perPortie" class="mt-1" />
      <p v-if="recipe.duimpjesOmhoog || recipe.duimpjesOmlaag" class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1"><ThumbsUp class="size-3" /> {{ recipe.duimpjesOmhoog || 0 }}</span>
        <span class="inline-flex items-center gap-1"><ThumbsDown class="size-3" /> {{ recipe.duimpjesOmlaag || 0 }}</span>
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Star, ThumbsUp, ThumbsDown } from "lucide-vue-next";
import { RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";

defineProps<{ recipe: any }>();
</script>
