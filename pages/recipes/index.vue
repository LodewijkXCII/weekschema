<template>
  <div class="mx-auto max-w-[1200px] px-4 py-6 lg:px-6">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="bg-hero text-primary-foreground grid size-11 place-items-center rounded-2xl">
          <ChefHat class="size-5" />
        </span>
        <div>
          <h1 class="font-display text-2xl font-bold text-foreground">Recepten</h1>
          <p class="text-sm text-muted-foreground">{{ recipes.length }} gerechten in je bibliotheek</p>
        </div>
      </div>
      <NuxtLink to="/recipes/new" class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90">
        <Plus class="size-4" /> Nieuw recept
      </NuxtLink>
    </header>

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        :class="alleenFavorieten ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
        @click="alleenFavorieten = !alleenFavorieten"
      >
        <Star class="size-3.5" :fill="alleenFavorieten ? 'currentColor' : 'none'" /> Alleen favorieten
      </button>
      <button
        v-for="c in categorieen"
        :key="c"
        type="button"
        class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        :class="categorieFilter === c ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
        @click="categorieFilter = categorieFilter === c ? '' : c"
      >{{ RECIPE_CATEGORIE_LABELS[c] }}</button>
      <select v-if="alleTags.length" v-model="tagFilter" class="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium outline-none">
        <option value="">Alle tags</option>
        <option v-for="t in alleTags" :key="t" :value="t">#{{ t }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <article
        v-for="r in gefilterd"
        :key="r.id"
        class="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:shadow-lift"
        @click="openDetail(r)"
      >
        <RecipeThumb :recipe="r" />
        <div class="p-3">
          <p class="flex items-center gap-1 truncate text-sm font-medium">
            <Star v-if="r.favoriet" class="size-3.5 shrink-0 text-accent" fill="currentColor" />
            {{ r.naam }}
          </p>
          <span class="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground uppercase">{{ RECIPE_CATEGORIE_LABELS[r.categorie] }}</span>
          <div v-if="r.tags?.length" class="mt-1.5 flex flex-wrap gap-1">
            <span v-for="t in r.tags" :key="t" class="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">#{{ t }}</span>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">{{ r.porties }} portie(s)</p>
          <p class="mt-1 text-xs tabular-nums text-muted-foreground">
            {{ Math.round(r.perPortie.kcal) }} kcal · <span style="color:var(--protein)">E {{ Math.round(r.perPortie.eiwit) }}g</span> ·
            <span style="color:var(--carbs)">K {{ Math.round(r.perPortie.kh) }}g</span> ·
            <span style="color:var(--fat)">V {{ Math.round(r.perPortie.vet) }}g</span>
          </p>
          <p v-if="r.duimpjesOmhoog || r.duimpjesOmlaag" class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1"><ThumbsUp class="size-3" /> {{ r.duimpjesOmhoog || 0 }}</span>
            <span class="inline-flex items-center gap-1"><ThumbsDown class="size-3" /> {{ r.duimpjesOmlaag || 0 }}</span>
          </p>
        </div>
      </article>
      <p v-if="gefilterd.length === 0" class="text-sm text-muted-foreground">Geen recepten gevonden.</p>
    </div>

    <RecipeDetail :recipe="activeRecipe" @close="activeRecipe = null" @updated="onUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ChefHat, Plus, Star, ThumbsUp, ThumbsDown } from "lucide-vue-next";
import { RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";

const categorieen = ["ontbijt", "lunch", "diner", "tussendoor"] as const;

const recipes = ref<any[]>([]);
const activeRecipe = ref<any | null>(null);
const alleenFavorieten = ref(false);
const tagFilter = ref("");
const categorieFilter = ref("");

onMounted(async () => {
  recipes.value = await $fetch("/api/recipes" as any);
});

const alleTags = computed(() => {
  const set = new Set<string>();
  for (const r of recipes.value) for (const t of r.tags ?? []) set.add(t);
  return [...set].sort();
});

const gefilterd = computed(() =>
  recipes.value.filter((r) => {
    if (alleenFavorieten.value && !r.favoriet) return false;
    if (categorieFilter.value && r.categorie !== categorieFilter.value) return false;
    if (tagFilter.value && !(r.tags ?? []).includes(tagFilter.value)) return false;
    return true;
  })
);

function openDetail(recipe: any) {
  activeRecipe.value = recipe;
}

function onUpdated(updated: any) {
  const i = recipes.value.findIndex((r) => r.id === updated.id);
  if (i !== -1) recipes.value[i] = { ...recipes.value[i], ...updated };
  activeRecipe.value = { ...activeRecipe.value, ...updated };
}
</script>
