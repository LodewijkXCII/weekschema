<template>
  <section class="rounded-3xl border border-border bg-card p-4 shadow-soft">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-display flex items-center gap-2 text-lg font-semibold">
        <ChefHat class="size-4 text-muted-foreground" /> Gerechtenbibliotheek
      </h2>
      <NuxtLink to="/recipes/new" class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90">
        <Plus class="size-4" /> Gerecht toevoegen
      </NuxtLink>
    </div>
    <div class="mt-3 grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
      <SearchInput v-model="search" placeholder="Zoek een gerecht of tag…" />
      <div class="flex flex-wrap gap-1.5">
        <FilterChip :active="categorie === null" @click="categorie = null">Alle</FilterChip>
        <FilterChip v-for="c in RECIPE_CATEGORIEEN" :key="c" :active="categorie === c" @click="categorie = c">
          {{ RECIPE_CATEGORIE_LABELS[c] }}
        </FilterChip>
      </div>
    </div>
    <p class="mt-3 text-xs text-muted-foreground">{{ filtered.length }} gerechten — sleep ze naar een eetmoment of klik voor de bereiding</p>
    <div class="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <RecipeListItem
        v-for="r in filtered"
        :key="r.id"
        :recipe="r"
        draggable="true"
        class="cursor-grab active:cursor-grabbing"
        @dragstart="$emit('dragstart', r.id)"
      />
      <p v-if="filtered.length === 0" class="text-xs text-muted-foreground">Geen gerechten gevonden.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChefHat, Plus } from "lucide-vue-next";
import { RECIPE_CATEGORIEEN, RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";

const props = defineProps<{ recipes: any[] }>();
defineEmits<{ (e: "dragstart", recipeId: string): void }>();

const categorie = ref<string | null>(null);
const search = ref("");

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return props.recipes.filter((r) => {
    if (categorie.value && r.categorie !== categorie.value) return false;
    if (!q) return true;
    return r.naam.toLowerCase().includes(q) || (r.tags ?? []).some((t: string) => t.toLowerCase().includes(q));
  });
});
</script>
