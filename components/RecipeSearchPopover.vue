<template>
  <div class="absolute top-full z-20 mt-1 w-64 rounded-2xl border border-border bg-card p-2 shadow-lift" :class="alignRight ? 'right-0' : 'left-0'">
    <div class="mb-1.5 flex items-center justify-between gap-2 px-1">
      <p class="text-[10px] font-semibold tracking-wide text-primary uppercase">{{ categorieLabel }}</p>
      <div class="flex rounded-lg bg-secondary p-0.5 text-[11px] font-medium">
        <button
          v-for="m in MODES"
          :key="m.key"
          type="button"
          class="rounded-md px-2 py-0.5 transition-colors"
          :class="mode === m.key ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'"
          @click="setMode(m.key)"
        >{{ m.label }}</button>
      </div>
    </div>

    <template v-if="mode === 'recept'">
      <input
        v-model="query"
        autofocus
        placeholder="Zoek recept…"
        class="form-input"
        @keydown.esc="$emit('close')"
      />
      <button type="button" class="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary" @click="$emit('suggest', filtered)">
        <Dices class="size-3.5" /> Suggestie
      </button>
      <div class="mt-1.5 max-h-44 overflow-y-auto">
        <div
          v-for="r in filtered"
          :key="r.id"
          class="cursor-pointer rounded-xl px-2 py-1.5 text-sm hover:bg-secondary"
          @click="$emit('choose', r)"
        >
          {{ r.favoriet ? "★ " : "" }}{{ r.naam }}
        </div>
        <p v-if="filtered.length === 0" class="p-1.5 text-xs text-muted-foreground">
          Geen "{{ categorieLabel }}"-recepten gevonden.
        </p>
      </div>
    </template>

    <!-- Los ingrediënt: bv. een handje noten of een Breaker als tussendoortje. -->
    <template v-else-if="!selectedIngredient">
      <input
        ref="ingredientQueryInput"
        v-model="ingredientQuery"
        placeholder="Zoek ingrediënt…"
        class="form-input"
        @keydown.esc="$emit('close')"
        @keydown.enter.prevent="filteredIngredients[0] && selectIngredient(filteredIngredients[0])"
      />
      <div class="mt-1.5 max-h-52 overflow-y-auto">
        <div
          v-for="ing in filteredIngredients"
          :key="ing.id"
          class="cursor-pointer truncate rounded-xl px-2 py-1.5 text-sm hover:bg-secondary"
          @click="selectIngredient(ing)"
        >
          {{ ing.naam }}
        </div>
        <p v-if="filteredIngredients.length === 0" class="p-1.5 text-xs text-muted-foreground">
          Geen ingrediënten gevonden.
          <NuxtLink to="/ingredients/new" class="font-medium text-primary hover:underline">Nieuw ingrediënt</NuxtLink>
        </p>
      </div>
    </template>

    <form v-else @submit.prevent="submitIngredient">
      <div class="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-2 py-1.5">
        <span class="truncate text-sm font-medium" :title="selectedIngredient.naam">{{ selectedIngredient.naam }}</span>
        <button type="button" aria-label="Ander ingrediënt" class="shrink-0 text-muted-foreground hover:text-foreground" @click="selectedIngredient = null">
          <X class="size-3.5" />
        </button>
      </div>
      <div class="mt-1.5 flex gap-1.5">
        <input
          ref="hoeveelheidInput"
          v-model.number="hoeveelheid"
          type="number"
          min="0.1"
          step="any"
          required
          aria-label="Hoeveelheid"
          class="form-input min-w-0 flex-1 tabular-nums"
          @keydown.esc="$emit('close')"
        />
        <select v-model="eenheid" aria-label="Eenheid" class="form-input w-24 shrink-0 px-2">
          <option v-for="u in availableUnits" :key="u.key" :value="u.key">{{ u.label }}</option>
        </select>
      </div>
      <p class="mt-1 px-1 text-[11px] tabular-nums text-muted-foreground">
        <template v-if="preview">
          {{ preview.gram }} g · {{ Math.round(preview.macros.kcal) }} kcal · {{ Math.round(preview.macros.eiwit) }} g eiwit
        </template>
        <template v-else>Vul een hoeveelheid in</template>
      </p>
      <button
        type="submit"
        :disabled="!preview"
        class="mt-1.5 w-full rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Toevoegen
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Dices, X } from "lucide-vue-next";
import { INGREDIENT_UNITS, eenheidNaarGram, type IngredientUnitKey } from "~/composables/useIngredientUnits";
import { ingredientMacros } from "~/composables/useMacros";

const props = defineProps<{
  recipes: any[];
  ingredients: any[];
  categorieLabel: string;
  alignRight?: boolean;
  // Waarmee de popover opent -- voor tussendoortjes is een los ingrediënt
  // meestal handiger dan een recept.
  defaultMode?: "recept" | "ingredient";
}>();
const emit = defineEmits<{
  (e: "choose", recipe: any): void;
  // De (gefilterde) recepten waaruit een suggestie gekozen moet worden.
  (e: "suggest", candidates: any[]): void;
  (e: "choose-ingredient", value: { ingredient: any; hoeveelheid: number; eenheid: IngredientUnitKey }): void;
  (e: "close"): void;
}>();

const MODES = [
  { key: "recept", label: "Recept" },
  { key: "ingredient", label: "Ingrediënt" }
] as const;

const mode = ref<"recept" | "ingredient">(props.defaultMode ?? "recept");
const query = ref("");
const ingredientQuery = ref("");
const selectedIngredient = ref<any | null>(null);
const hoeveelheid = ref<number | null>(null);
const eenheid = ref<IngredientUnitKey>("gram");
const ingredientQueryInput = ref<HTMLInputElement | null>(null);
const hoeveelheidInput = ref<HTMLInputElement | null>(null);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.recipes;
  return props.recipes.filter((r) => r.naam.toLowerCase().includes(q));
});

const filteredIngredients = computed(() => {
  const q = ingredientQuery.value.trim().toLowerCase();
  if (!q) return props.ingredients;
  return props.ingredients.filter((i) => i.naam.toLowerCase().includes(q));
});

// "stuks" alleen aanbieden als het ingrediënt een gewicht per stuk heeft.
const availableUnits = computed(() =>
  INGREDIENT_UNITS.filter((u) => u.key !== "stuks" || selectedIngredient.value?.gramPerStuk)
);

// Alleen een voorvertoning -- de echte omrekening doet de server.
const preview = computed(() => {
  if (!selectedIngredient.value || !(hoeveelheid.value && hoeveelheid.value > 0)) return null;
  const gram = eenheidNaarGram(hoeveelheid.value, eenheid.value, selectedIngredient.value.gramPerStuk);
  return { gram, macros: ingredientMacros(selectedIngredient.value, gram) };
});

function setMode(m: "recept" | "ingredient") {
  mode.value = m;
  if (m === "ingredient") nextTick(() => ingredientQueryInput.value?.focus());
}

function selectIngredient(ing: any) {
  selectedIngredient.value = ing;
  // Met een gewicht per stuk ("1 Breaker") is "1 stuk" de logische start,
  // anders een handje van 25 gram.
  if (ing.gramPerStuk) {
    eenheid.value = "stuks";
    hoeveelheid.value = 1;
  } else {
    eenheid.value = "gram";
    hoeveelheid.value = 25;
  }
  nextTick(() => hoeveelheidInput.value?.select());
}

function submitIngredient() {
  if (!preview.value) return;
  emit("choose-ingredient", {
    ingredient: selectedIngredient.value,
    hoeveelheid: hoeveelheid.value!,
    eenheid: eenheid.value
  });
}

onMounted(() => {
  if (mode.value === "ingredient") ingredientQueryInput.value?.focus();
});
</script>
