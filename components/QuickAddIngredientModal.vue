<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" @click="$emit('close')">
      <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-lift" @click.stop>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-lg font-bold">Ingrediënt toevoegen</h2>
          <button type="button" class="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary" @click="$emit('close')">
            <X class="size-4" />
          </button>
        </div>

        <IngredientSearch
          v-model:query="searchQuery"
          label="Zoek bij Albert Heijn / NEVO (optioneel)"
          placeholder="bijv. basilicum"
          compact
          class="mb-3"
          @select="onSelect"
        />

        <form class="space-y-3" @submit.prevent="submit">
          <p v-if="filledFromSearch" class="text-xs text-muted-foreground">✓ Macro's automatisch ingevuld -- pas ze hieronder aan indien nodig.</p>

          <IngredientFormFields v-model="form" compact />

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading">
            <Plus class="size-4" /> Toevoegen aan bibliotheek
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Plus } from "lucide-vue-next";
import { emptyIngredientForm, applySearchResult, ingredientPayload } from "~/composables/useIngredientForm";

const props = defineProps<{ open: boolean; initialNaam?: string }>();
const emit = defineEmits<{ (e: "close"): void; (e: "created", ingredient: any): void }>();

const form = ref(emptyIngredientForm());
const searchQuery = ref("");
const error = ref("");
const loading = ref(false);
const filledFromSearch = ref(false);

// Bij openen: formulier resetten en, als we vanuit een niet-herkend
// geïmporteerd ingrediënt komen, alvast de naam invullen én opzoeken --
// scheelt opnieuw typen voor het meest voorkomende geval.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    form.value = emptyIngredientForm(props.initialNaam ?? "");
    searchQuery.value = props.initialNaam ?? "";
    error.value = "";
    filledFromSearch.value = false;
  }
);

function onSelect(p: any) {
  applySearchResult(form.value, p);
  filledFromSearch.value = true;
}

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const created = await $fetch("/api/ingredients", { method: "POST", body: ingredientPayload(form.value) });
    emit("created", created);
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
