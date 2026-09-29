<template>
  <!-- Mobiele tegenhanger van MealSlotCell: één eetmoment als horizontale rij.
       Knoppen staan altijd in beeld, want op touch bestaat geen hover. -->
  <div class="flex items-center gap-3">
    <template v-if="mealSlot?.recipe || mealSlot?.ingredient">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="$emit('open')">
        <div v-if="mealSlot.recipe" class="size-16 flex-none overflow-hidden rounded-xl">
          <RecipeThumb :recipe="mealSlot.recipe" fill />
        </div>
        <div v-else class="grid size-16 flex-none place-items-center rounded-xl bg-secondary/70">
          <Apple class="size-6 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm leading-snug font-medium">{{ naam }}</p>
          <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums text-muted-foreground">
            <span v-if="mealSlot.ingredient">{{ formatHoeveelheid(mealSlot.ingredientHoeveelheid, mealSlot.ingredientEenheid) }}</span>
            <span>{{ Math.round(slotMacros(mealSlot).kcal) }} kcal</span>
            <span class="inline-flex items-center gap-0.5" :class="afwijkend ? 'font-semibold text-accent' : ''">
              <Users class="size-3" /> {{ personenLabel }}
            </span>
            <span v-if="kok" class="inline-flex items-center gap-0.5"><User class="size-3" /> {{ kok }}</span>
          </p>
          <p v-if="mealSlot.notitie" class="mt-0.5 flex items-start gap-1 text-xs text-accent">
            <StickyNote class="mt-px size-3 shrink-0" /> {{ mealSlot.notitie }}
          </p>
        </div>
      </button>
      <div v-if="editable" class="flex flex-none gap-0.5">
        <button type="button" title="Notitie" class="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" @click="$emit('notitie')">
          <StickyNote class="size-4" />
        </button>
        <button type="button" title="Aantal personen" class="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" @click="$emit('personen')">
          <Users class="size-4" />
        </button>
        <button type="button" title="Wie kookt" class="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" @click="$emit('kok')">
          <User class="size-4" />
        </button>
        <button type="button" title="Verwijderen" class="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" @click="$emit('clear')">
          <X class="size-4" />
        </button>
      </div>
    </template>
    <template v-else>
      <div class="grid size-16 flex-none place-items-center rounded-xl border border-dashed border-border">
        <span class="text-xs text-muted-foreground/50">—</span>
      </div>
      <p class="flex-1 text-sm text-muted-foreground/60">Nog niets gepland</p>
      <div v-if="editable" class="flex flex-none gap-1">
        <button type="button" title="Zoek recept of ingrediënt" class="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground" @click="$emit('search')">
          <Search class="size-4" />
        </button>
        <button type="button" title="Suggestie" class="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground" @click="$emit('suggest')">
          <Dices class="size-4" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { StickyNote, User, Users, X, Search, Dices, Apple } from "lucide-vue-next";
import { slotPersonen, defaultPersonen } from "~/composables/useMealMoments";
import { slotMacros } from "~/composables/useMacros";
import { formatHoeveelheid } from "~/composables/useIngredientUnits";

const props = defineProps<{
  mealSlot: any | null;
  editable: boolean;
  // Naam van wie er kookt, of "" als niemand is toegewezen.
  kok: string;
}>();

const naam = computed(() => props.mealSlot?.recipe?.naam ?? props.mealSlot?.ingredient?.naam ?? "");
const personenLabel = computed(() => (props.mealSlot ? slotPersonen(props.mealSlot).toLocaleString("nl") : ""));
const afwijkend = computed(
  () => props.mealSlot?.personen != null && props.mealSlot.personen !== defaultPersonen(props.mealSlot)
);

defineEmits<{
  (e: "open"): void;
  (e: "search"): void;
  (e: "suggest"): void;
  (e: "notitie"): void;
  (e: "kok"): void;
  (e: "personen"): void;
  (e: "clear"): void;
}>();
</script>
