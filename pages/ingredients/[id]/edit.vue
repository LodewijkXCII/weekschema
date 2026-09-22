<template>
  <div class="mx-auto max-w-[520px] px-4 py-6 lg:px-6">
    <PageHeader :icon="Pencil" title="Ingrediënt bewerken" subtitle="Macro's altijd per 100 gram (of 100 ml)">
      <NuxtLink to="/ingredients" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
        <ArrowLeft class="size-4" /> Terug
      </NuxtLink>
    </PageHeader>

    <div v-if="!loaded" class="text-sm text-muted-foreground">Laden…</div>
    <p v-else-if="!form" class="text-sm text-destructive">{{ error }}</p>

    <template v-else>
      <IngredientSearch
        label="Opnieuw zoeken bij Albert Heijn (optioneel, om macro's te verversen)"
        class="mb-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
        @select="onSelect"
      />

      <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="submit">
        <p v-if="filledFromSearch" class="text-xs text-muted-foreground">
          ✓ Macro's automatisch ingevuld vanuit Albert Heijn -- pas ze hieronder aan indien nodig.
        </p>

        <IngredientFormFields v-model="form" />

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <p v-if="success" class="text-sm text-primary">Opgeslagen.</p>
        <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading">
          <Check class="size-4" /> Wijzigingen opslaan
        </button>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Pencil, ArrowLeft, Check } from "lucide-vue-next";
import { ingredientFormFrom, applySearchResult, ingredientPayload, type IngredientFormState } from "~/composables/useIngredientForm";

const route = useRoute();
const ingredientId = route.params.id as string;

const form = ref<IngredientFormState | null>(null);
const error = ref("");
const success = ref(false);
const loading = ref(false);
const loaded = ref(false);
const filledFromSearch = ref(false);

onMounted(async () => {
  const all = await $fetch<any[]>("/api/ingredients" as any);
  const ing = all.find((i) => i.id === ingredientId);
  if (ing) form.value = ingredientFormFrom(ing);
  else error.value = "Ingrediënt niet gevonden";
  loaded.value = true;
});

function onSelect(p: any) {
  if (!form.value) return;
  applySearchResult(form.value, p);
  filledFromSearch.value = true;
}

async function submit() {
  if (!form.value) return;
  loading.value = true;
  error.value = "";
  success.value = false;
  try {
    await $fetch(`/api/ingredients/${ingredientId}`, { method: "PATCH", body: ingredientPayload(form.value) });
    success.value = true;
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
