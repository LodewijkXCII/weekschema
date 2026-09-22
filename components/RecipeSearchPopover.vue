<template>
  <div class="absolute top-full z-20 mt-1 w-56 rounded-2xl border border-border bg-card p-2 shadow-lift" :class="alignRight ? 'right-0' : 'left-0'">
    <p class="mb-1.5 px-1 text-[10px] font-semibold tracking-wide text-primary uppercase">{{ categorieLabel }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { Dices } from "lucide-vue-next";

const props = defineProps<{ recipes: any[]; categorieLabel: string; alignRight?: boolean }>();
defineEmits<{
  (e: "choose", recipe: any): void;
  // De (gefilterde) recepten waaruit een suggestie gekozen moet worden.
  (e: "suggest", candidates: any[]): void;
  (e: "close"): void;
}>();

const query = ref("");

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.recipes;
  return props.recipes.filter((r) => r.naam.toLowerCase().includes(q));
});
</script>
