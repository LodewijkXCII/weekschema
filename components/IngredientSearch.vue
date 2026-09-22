<template>
  <div>
    <FormField :label="label" class="mb-2">
      <input v-model="query" :placeholder="placeholder" autocomplete="off" class="form-input" />
    </FormField>
    <p v-if="loading" class="text-xs text-muted-foreground">Zoeken…</p>
    <p v-else-if="error" class="text-xs text-destructive">{{ error }}</p>
    <p v-else-if="query.trim().length >= 2 && results.length === 0" class="text-xs text-muted-foreground">
      Geen producten met bekende voedingswaarden gevonden.
    </p>

    <div v-if="results.length" class="mt-2 flex flex-col gap-1 overflow-y-auto" :class="compact ? 'max-h-52' : 'max-h-80'">
      <button
        v-for="p in results"
        :key="p.id"
        type="button"
        class="flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 text-left transition-colors hover:border-border hover:bg-secondary"
        @click="select(p)"
      >
        <img v-if="p.afbeeldingUrl" :src="p.afbeeldingUrl" :alt="p.naam" class="size-9 shrink-0 rounded-lg bg-background object-contain" />
        <div v-else class="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-base">{{ p.bron === "nevo" ? "🥦" : "🛒" }}</div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ p.naam }}</p>
          <p v-if="p.bron === 'nevo'" class="mt-0.5 text-xs text-muted-foreground">
            <span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">NEVO</span>
            {{ p.winkelCategorie }}
          </p>
          <p v-else class="mt-0.5 text-xs text-muted-foreground">{{ p.merk }} · {{ p.inhoud }}</p>
        </div>
        <div class="shrink-0 text-right text-xs text-muted-foreground">
          {{ Math.round(p.kcalPer100g) }} kcal<template v-if="!compact"> · {{ p.eiwitPer100g }}g E</template>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Live zoeken bij Albert Heijn / NEVO (/api/ingredients/search), met
// debounce en bescherming tegen trage, verouderde antwoorden.
withDefaults(defineProps<{ label: string; placeholder?: string; compact?: boolean }>(), {
  placeholder: "bijv. sojasaus"
});
const emit = defineEmits<{ (e: "select", product: any): void }>();
const query = defineModel<string>("query", { default: "" });

const results = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let requestId = 0;

watch(
  query,
  (q) => {
    clearTimeout(debounceTimer);
    const trimmed = q.trim();

    if (trimmed.length < 2) {
      requestId++;
      results.value = [];
      loading.value = false;
      error.value = "";
      return;
    }

    loading.value = true;
    error.value = "";
    debounceTimer = setTimeout(async () => {
      const myRequestId = ++requestId;
      try {
        const res = await $fetch<any[]>("/api/ingredients/search", { params: { q: trimmed } });
        if (myRequestId !== requestId) return;
        results.value = res;
      } catch (e: any) {
        if (myRequestId !== requestId) return;
        results.value = [];
        error.value = e?.data?.statusMessage ?? "Zoeken mislukt";
      } finally {
        if (myRequestId === requestId) loading.value = false;
      }
    }, 400);
  },
  { immediate: true }
);

onUnmounted(() => clearTimeout(debounceTimer));

function select(p: any) {
  emit("select", p);
  query.value = "";
}
</script>
