<template>
  <div class="mx-auto max-w-[520px] px-4 py-6 lg:px-6">
    <PageHeader :icon="Beef" title="Ingrediënt toevoegen" subtitle="Macro's altijd per 100 gram (of 100 ml)" />

    <IngredientSearch label="Zoek bij Albert Heijn (optioneel)" class="mb-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @select="onSelect" />

    <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="submit">
      <p v-if="filledFromSearch" class="text-xs text-muted-foreground">
        ✓ Macro's automatisch ingevuld vanuit Albert Heijn -- pas ze hieronder aan indien nodig.
      </p>

      <IngredientFormFields v-model="form" />

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <p v-if="success" class="text-sm text-primary">Toegevoegd! Je kunt er nog een invoeren.</p>
      <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading">
        <Plus class="size-4" /> Opslaan
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Beef, Plus } from "lucide-vue-next";
import { emptyIngredientForm, applySearchResult, ingredientPayload } from "~/composables/useIngredientForm";

const form = ref(emptyIngredientForm());
const error = ref("");
const success = ref(false);
const loading = ref(false);
const filledFromSearch = ref(false);

function onSelect(p: any) {
  applySearchResult(form.value, p);
  filledFromSearch.value = true;
}

async function submit() {
  loading.value = true;
  error.value = "";
  success.value = false;
  try {
    await $fetch<any>("/api/ingredients" as any, { method: "POST", body: ingredientPayload(form.value) });
    success.value = true;
    filledFromSearch.value = false;
    form.value = emptyIngredientForm();
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
