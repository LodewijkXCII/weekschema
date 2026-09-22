<template>
  <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="$emit('submit')">
    <slot name="notice" />
    <!-- Geteleporteerd naar <body>, dus geen genest <form> in de DOM. -->
    <QuickAddIngredientModal :open="quickAddOpen" :initial-naam="quickAddInitialNaam" @close="quickAddOpen = false" @created="onIngredientCreated" />

    <FormField label="Naam">
      <input v-model="form.naam" required class="form-input" />
    </FormField>

    <div>
      <span class="text-xs font-medium text-muted-foreground">Categorie</span>
      <div class="mt-1 flex flex-wrap gap-1.5">
        <FilterChip v-for="c in RECIPE_CATEGORIEEN" :key="c" :active="form.categorie === c" @click="form.categorie = c">
          {{ RECIPE_CATEGORIE_LABELS[c] }}
        </FilterChip>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <FormField label="Aantal porties">
        <input v-model.number="form.porties" type="number" min="1" required class="form-input tabular-nums" />
      </FormField>
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">{{ photoLabel }}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="mt-1.5 block text-sm" @change="onFile" />
      </label>
    </div>

    <FormField label="Bereidingswijze (optioneel)">
      <textarea v-model="form.bereiding" rows="4" class="form-input" />
    </FormField>

    <FormField label="Tags (optioneel, komma-gescheiden, bv. snel, vegetarisch)">
      <input v-model="form.tags" placeholder="snel, vegetarisch" class="form-input" />
    </FormField>

    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" v-model="form.favoriet" class="size-4 accent-primary" />
      <Star class="size-3.5 text-accent" :fill="form.favoriet ? 'currentColor' : 'none'" /> Markeer als favoriet
    </label>

    <div>
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ingrediënten</span>
        <button type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" @click="form.rows.push(emptyRecipeRow())">
          <Plus class="size-3.5" /> Regel
        </button>
      </div>
      <div class="mt-2 space-y-2">
        <RecipeIngredientRow
          v-for="(_, i) in form.rows"
          :key="i"
          v-model="form.rows[i]"
          :ingredients="ingredients"
          @quick-add="openQuickAdd(i)"
          @remove="form.rows.splice(i, 1)"
        />
      </div>
    </div>

    <p v-if="ingredients.length === 0" class="text-sm text-muted-foreground">
      Nog geen ingrediënten in je bibliotheek. <NuxtLink to="/ingredients/new" class="font-medium text-primary hover:underline">Voeg er eerst een toe</NuxtLink>.
    </p>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <button
      type="submit"
      class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      :disabled="loading || form.rows.length === 0 || heeftOngeldigeStuksRegel"
    >
      <slot name="submit">Opslaan</slot>
    </button>
  </form>
</template>

<script setup lang="ts">
import { Star, Plus } from "lucide-vue-next";
import { RECIPE_CATEGORIEEN, RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";
import { emptyRecipeRow, type RecipeFormState } from "~/composables/useRecipeForm";

// Gedeeld formulier voor recept toevoegen én bewerken. De ouder bezit de
// state (zodat bv. een import 'm kan vullen) en doet zelf de API-call bij
// `submit`; dit component laadt alleen de ingrediënten voor de pickers.
withDefaults(defineProps<{ loading?: boolean; error?: string; photoLabel?: string }>(), {
  photoLabel: "Foto (optioneel)"
});
defineEmits<{ (e: "submit"): void }>();
const form = defineModel<RecipeFormState>({ required: true });

const ingredients = ref<any[]>([]);

onMounted(async () => {
  ingredients.value = await $fetch<any[]>("/api/ingredients" as any);
});

function ingredientGramPerStuk(ingredientId: string) {
  return ingredients.value.find((i) => i.id === ingredientId)?.gramPerStuk ?? null;
}

// "stuks" kan alleen opgeslagen worden als het gekozen ingrediënt een
// gewicht per stuk heeft -- anders zou de server dit recept met een
// onduidelijke foutmelding weigeren.
const heeftOngeldigeStuksRegel = computed(() =>
  form.value.rows.some((r) => r.eenheid === "stuks" && (!r.ingredientId || !ingredientGramPerStuk(r.ingredientId)))
);

function onFile(e: Event) {
  form.value.photo = (e.target as HTMLInputElement).files?.[0] ?? null;
}

const quickAddOpen = ref(false);
const quickAddInitialNaam = ref("");
const quickAddRowIndex = ref<number | null>(null);

function openQuickAdd(i: number) {
  quickAddRowIndex.value = i;
  quickAddInitialNaam.value = form.value.rows[i]._importNaam ?? "";
  quickAddOpen.value = true;
}

function onIngredientCreated(created: any) {
  ingredients.value.push(created);
  if (quickAddRowIndex.value !== null) {
    const row = form.value.rows[quickAddRowIndex.value];
    row.ingredientId = created.id;
    row._importNaam = null;
  }
  quickAddOpen.value = false;
}
</script>
