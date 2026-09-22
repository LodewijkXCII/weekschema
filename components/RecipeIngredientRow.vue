<template>
  <div>
    <div class="flex items-end gap-2">
      <div class="flex-[2]">
        <span class="text-xs font-medium text-muted-foreground">Ingrediënt</span>
        <div class="mt-1">
          <IngredientPicker v-model="row.ingredientId" :ingredients="ingredients" />
        </div>
      </div>
      <button
        type="button"
        title="Nieuw ingrediënt toevoegen"
        :aria-label="row._importNaam ? `Nieuw ingrediënt toevoegen voor ${row._importNaam}` : 'Nieuw ingrediënt toevoegen'"
        class="grid size-9 shrink-0 place-items-center rounded-xl border transition-colors"
        :class="row._importNaam ? 'border-primary text-primary hover:bg-primary/10' : 'border-border text-muted-foreground hover:bg-secondary'"
        @click="$emit('quick-add')"
      >
        <Plus class="size-4" />
      </button>
      <FormField label="Hoeveelheid" class="flex-1">
        <input v-model.number="row.hoeveelheid" type="number" min="0.1" step="0.1" required class="form-input tabular-nums" />
      </FormField>
      <FormField label="Eenheid" class="w-28 shrink-0">
        <select v-model="row.eenheid" class="form-input px-2">
          <option v-for="u in INGREDIENT_UNITS" :key="u.key" :value="u.key">{{ u.label }}</option>
        </select>
      </FormField>
      <button type="button" aria-label="Regel verwijderen" class="grid size-9 shrink-0 place-items-center text-muted-foreground hover:text-destructive" @click="$emit('remove')">
        <X class="size-4" />
      </button>
    </div>
    <p v-if="missingGramPerStuk" class="mt-0.5 text-[11px] text-destructive">
      Dit ingrediënt heeft nog geen gewicht per stuk -- stel dit in via <NuxtLink :to="`/ingredients/${row.ingredientId}/edit`" class="font-medium hover:underline">bewerken</NuxtLink>, anders kan dit recept niet opgeslagen worden.
    </p>
    <p v-if="row._importNaam" class="mt-0.5 text-[11px] text-muted-foreground">
      Geïmporteerd als "{{ row._importNaam }}" -- niet automatisch gevonden.
      <button
        v-if="row._suggestieId"
        type="button"
        class="font-medium text-primary hover:underline"
        @click="row.ingredientId = row._suggestieId!; row._importNaam = null"
      >Bedoel je "{{ row._suggestieNaam }}"?</button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { Plus, X } from "lucide-vue-next";
import { INGREDIENT_UNITS } from "~/composables/useIngredientUnits";
import type { RecipeFormRow } from "~/composables/useRecipeForm";

const props = defineProps<{ ingredients: any[] }>();
defineEmits<{ (e: "quick-add"): void; (e: "remove"): void }>();
const row = defineModel<RecipeFormRow>({ required: true });

const missingGramPerStuk = computed(
  () =>
    row.value.eenheid === "stuks" &&
    !!row.value.ingredientId &&
    !props.ingredients.find((i) => i.id === row.value.ingredientId)?.gramPerStuk
);
</script>
