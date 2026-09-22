<template>
  <div class="relative">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
      @click="toggle"
    >
      <span class="truncate" :class="!selected ? 'text-muted-foreground' : ''">{{ selected ? selected.naam : "Kies een ingrediënt..." }}</span>
      <ChevronDown class="size-4 shrink-0 text-muted-foreground" />
    </button>

    <template v-if="open">
      <div class="fixed inset-0 z-20" @click="close"></div>
      <div class="absolute z-30 mt-1 w-full min-w-[240px] rounded-xl border border-border bg-card shadow-lift">
        <div class="p-2">
          <input
            ref="searchInput"
            v-model="search"
            placeholder="Zoek ingrediënt..."
            class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            @keydown.esc="close"
            @keydown.enter.prevent="selectFirstMatch"
          />
        </div>
        <div class="max-h-64 overflow-y-auto px-1 pb-1">
          <template v-if="search.trim()">
            <button
              v-for="ing in filtered"
              :key="ing.id"
              type="button"
              class="block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-secondary"
              @click="select(ing)"
            >{{ ing.favoriet ? "★ " : "" }}{{ ing.naam }}</button>
            <p v-if="filtered.length === 0" class="px-2.5 py-3 text-xs text-muted-foreground">Niets gevonden.</p>
          </template>
          <template v-else>
            <div v-for="group in grouped" :key="group.categorie">
              <p class="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{{ group.categorie }}</p>
              <button
                v-for="ing in group.items"
                :key="ing.id"
                type="button"
                class="block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-secondary"
                @click="select(ing)"
              >{{ ing.favoriet ? "★ " : "" }}{{ ing.naam }}</button>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";

const props = defineProps<{ modelValue: string; ingredients: any[] }>();
const emit = defineEmits<{ (e: "update:modelValue", id: string): void }>();

const open = ref(false);
const search = ref("");
const searchInput = ref<HTMLInputElement | null>(null);

const selected = computed(() => props.ingredients.find((i) => i.id === props.modelValue) ?? null);

// Zonder zoekterm: gegroepeerd op winkelcategorie, net als de
// boodschappenlijst -- een logische, overzichtelijke opbouw om doorheen te
// bladeren i.p.v. één platte lijst van (uiteindelijk) honderden namen.
const grouped = computed(() => {
  const groups = new Map<string, any[]>();
  for (const ing of props.ingredients) {
    const key = ing.winkelCategorie || "Overig";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }
  for (const items of groups.values()) items.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "Overig" ? 1 : b === "Overig" ? -1 : a.localeCompare(b, "nl")))
    .map(([categorie, items]) => ({ categorie, items }));
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return props.ingredients
    .filter((i) => i.naam.toLowerCase().includes(q))
    .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
});

function toggle() {
  open.value = !open.value;
  if (open.value) {
    search.value = "";
    nextTick(() => searchInput.value?.focus());
  }
}

function close() {
  open.value = false;
}

function select(ing: any) {
  emit("update:modelValue", ing.id);
  close();
}

function selectFirstMatch() {
  if (filtered.value.length > 0) select(filtered.value[0]);
}
</script>
