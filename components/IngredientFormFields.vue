<template>
  <FormField label="Naam">
    <input v-model="form.naam" required class="form-input" />
  </FormField>

  <div class="grid grid-cols-2 gap-3">
    <FormField label="Kcal per 100g">
      <input v-model.number="form.kcalPer100g" type="number" step="0.1" required class="form-input tabular-nums" />
    </FormField>
    <FormField :label="compact ? 'Eiwit (g)' : 'Eiwit (g) per 100g'">
      <input v-model.number="form.eiwitPer100g" type="number" step="0.1" required class="form-input tabular-nums" />
    </FormField>
    <FormField :label="compact ? 'Vet (g)' : 'Vet (g) per 100g'">
      <input v-model.number="form.vetPer100g" type="number" step="0.1" required class="form-input tabular-nums" />
    </FormField>
    <FormField :label="compact ? 'Koolhydraten (g)' : 'Koolhydraten (g) per 100g'">
      <input v-model.number="form.koolhydratenPer100g" type="number" step="0.1" required class="form-input tabular-nums" />
    </FormField>
  </div>

  <FormField :label="compact ? 'Winkelcategorie (optioneel)' : 'Winkelcategorie (optioneel, voor sortering boodschappenlijst)'">
    <input v-model="form.winkelCategorie" placeholder="bv. Zuivel, eieren" class="form-input" />
  </FormField>

  <FormField :label="gramPerStukLabel">
    <input v-model.number="form.gramPerStuk" type="number" step="0.1" min="0" placeholder="bv. 180 voor 1 appel" class="form-input tabular-nums" />
  </FormField>

  <template v-if="!compact">
    <FormField label="Allergenen (optioneel, komma-gescheiden)">
      <input v-model="form.allergenen" placeholder="gluten, noten" class="form-input" />
    </FormField>

    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" v-model="form.basisvoorraad" class="size-4 accent-primary" />
      Basisvoorraad (staat meestal al in huis, standaard uitgevinkt op de boodschappenlijst)
    </label>
  </template>
</template>

<script setup lang="ts">
import type { IngredientFormState } from "~/composables/useIngredientForm";

// Invoervelden voor een ingrediënt, zonder <form> eromheen. `compact` (de
// snel-toevoegen-modal) laat allergenen/basisvoorraad weg en kort labels in.
const props = defineProps<{ compact?: boolean }>();
const form = defineModel<IngredientFormState>({ required: true });

const gramPerStukLabel = computed(
  () => `Gewicht per stuk in gram (optioneel, voor "stuks" als eenheid${props.compact ? "" : " in recepten"})`
);
</script>
