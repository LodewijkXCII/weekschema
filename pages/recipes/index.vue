<template>
  <div class="mx-auto max-w-[1200px] px-4 py-6 lg:px-6">
    <PageHeader :icon="ChefHat" title="Recepten" :subtitle="`${recipes.length} gerechten in je bibliotheek`">
      <NuxtLink to="/recipes/new" class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90">
        <Plus class="size-4" /> Nieuw recept
      </NuxtLink>
    </PageHeader>

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <FilterChip :active="alleenFavorieten" @click="alleenFavorieten = !alleenFavorieten">
        <Star class="size-3.5" :fill="alleenFavorieten ? 'currentColor' : 'none'" /> Alleen favorieten
      </FilterChip>
      <FilterChip
        v-for="c in RECIPE_CATEGORIEEN"
        :key="c"
        :active="categorieFilter === c"
        @click="categorieFilter = categorieFilter === c ? '' : c"
      >{{ RECIPE_CATEGORIE_LABELS[c] }}</FilterChip>
      <select v-if="alleTags.length" v-model="tagFilter" class="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium outline-none">
        <option value="">Alle tags</option>
        <option v-for="t in alleTags" :key="t" :value="t">#{{ t }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <RecipeCard v-for="r in gefilterd" :key="r.id" :recipe="r" @click="activeRecipe = r" />
      <p v-if="gefilterd.length === 0" class="text-sm text-muted-foreground">Geen recepten gevonden.</p>
    </div>

    <RecipeDetail :recipe="activeRecipe" @close="activeRecipe = null" @updated="onUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ChefHat, Plus, Star } from "lucide-vue-next";
import { RECIPE_CATEGORIEEN, RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";

const recipes = ref<any[]>([]);
const activeRecipe = ref<any | null>(null);
const alleenFavorieten = ref(false);
const tagFilter = ref("");
const categorieFilter = ref("");

onMounted(async () => {
  recipes.value = await $fetch<any[]>("/api/recipes" as any);
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

function onUpdated(updated: any) {
  const i = recipes.value.findIndex((r) => r.id === updated.id);
  if (i !== -1) recipes.value[i] = { ...recipes.value[i], ...updated };
  activeRecipe.value = { ...activeRecipe.value, ...updated };
}
</script>
