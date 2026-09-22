<template>
  <div class="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-xl">
    <div v-if="mealSlot?.recipe" class="relative flex h-full cursor-pointer flex-col" @click="$emit('open')">
      <span
        v-if="kok"
        class="absolute top-1 right-1 z-10 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        :title="kok"
      >
        {{ kok.charAt(0).toUpperCase() }}
      </span>
      <div class="min-h-0 flex-1 overflow-hidden rounded-lg">
        <RecipeThumb :recipe="mealSlot.recipe" fill />
      </div>
      <p class="mt-1 truncate text-xs font-medium shrink-0" :title="mealSlot.recipe.naam">
        <StickyNote v-if="mealSlot.notitie" class="mr-0.5 inline size-3 -translate-y-px text-accent" />
        {{ mealSlot.recipe.naam }}
      </p>
      <div v-if="editable" class="absolute inset-x-0 bottom-6 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent pt-4 pb-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" title="Notitie" class="grid size-5 place-items-center rounded text-white hover:bg-white/20" @click.stop="$emit('notitie')">
          <StickyNote class="size-3" />
        </button>
        <button type="button" title="Wie kookt" class="grid size-5 place-items-center rounded text-white hover:bg-white/20" @click.stop="$emit('kok')">
          <User class="size-3" />
        </button>
        <button type="button" title="Verwijderen" class="grid size-5 place-items-center rounded text-white hover:bg-white/20" @click.stop="$emit('clear')">
          <X class="size-3" />
        </button>
      </div>
    </div>
    <div v-else-if="editable" class="flex h-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border">
      <span class="text-xs text-muted-foreground/50 group-hover:hidden">+ voeg toe</span>
      <div class="hidden gap-1 group-hover:flex">
        <button type="button" title="Zoek recept" class="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" @click="$emit('search')">
          <Search class="size-3.5" />
        </button>
        <button type="button" title="Suggestie" class="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" @click="$emit('suggest')">
          <Dices class="size-3.5" />
        </button>
      </div>
    </div>
    <div v-else class="flex h-full items-center justify-center rounded-xl border border-dashed border-border">
      <span class="text-xs text-muted-foreground/50">—</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { StickyNote, User, X, Search, Dices } from "lucide-vue-next";

// Inhoud van één weekbord-vakje. Verwacht een ouder met de `group`-class
// (de <td>), zodat de knoppen bij hover over het hele vakje verschijnen.
defineProps<{
  mealSlot: any | null;
  editable: boolean;
  // Naam van wie er kookt, of "" als niemand is toegewezen.
  kok: string;
}>();
defineEmits<{
  (e: "open"): void;
  (e: "search"): void;
  (e: "suggest"): void;
  (e: "notitie"): void;
  (e: "kok"): void;
  (e: "clear"): void;
}>();
</script>
