<template>
  <div class="mx-auto max-w-[520px] px-4 py-6 lg:px-6">
    <header class="mb-6 flex items-center gap-3">
      <span class="bg-hero text-primary-foreground grid size-11 place-items-center rounded-2xl">
        <Beef class="size-5" />
      </span>
      <div>
        <h1 class="font-display text-2xl font-bold text-foreground">Ingrediënt toevoegen</h1>
        <p class="text-sm text-muted-foreground">Macro's altijd per 100 gram (of 100 ml)</p>
      </div>
    </header>

    <div class="mb-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <label class="mb-2 block">
        <span class="text-xs font-medium text-muted-foreground">Zoek bij Albert Heijn (optioneel)</span>
        <input v-model="ahQuery" placeholder="bijv. sojasaus" autocomplete="off" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <p v-if="ahLoading" class="text-xs text-muted-foreground">Zoeken…</p>
      <p v-else-if="ahError" class="text-xs text-destructive">{{ ahError }}</p>
      <p v-else-if="ahQuery.trim().length >= 2 && ahResults.length === 0" class="text-xs text-muted-foreground">
        Geen producten met bekende voedingswaarden gevonden.
      </p>

      <div v-if="ahResults.length" class="mt-2 flex max-h-80 flex-col gap-1 overflow-y-auto">
        <button
          v-for="p in ahResults"
          :key="p.id"
          type="button"
          class="flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 text-left transition-colors hover:border-border hover:bg-secondary"
          @click="selectAhProduct(p)"
        >
          <img v-if="p.afbeeldingUrl" :src="p.afbeeldingUrl" :alt="p.naam" class="size-9 shrink-0 rounded-lg bg-background object-contain" />
          <div v-else class="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-base">🛒</div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ p.naam }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ p.merk }} · {{ p.inhoud }}</p>
          </div>
          <div class="shrink-0 text-right text-xs text-muted-foreground">{{ Math.round(p.kcalPer100g) }} kcal · {{ p.eiwitPer100g }}g E</div>
        </button>
      </div>
    </div>

    <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="submit">
      <p v-if="filledFromAh" class="text-xs text-muted-foreground">
        ✓ Macro's automatisch ingevuld vanuit Albert Heijn -- pas ze hieronder aan indien nodig.
      </p>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Naam</span>
        <input v-model="form.naam" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Kcal per 100g</span>
          <input v-model.number="form.kcalPer100g" type="number" step="0.1" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Eiwit (g) per 100g</span>
          <input v-model.number="form.eiwitPer100g" type="number" step="0.1" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Vet (g) per 100g</span>
          <input v-model.number="form.vetPer100g" type="number" step="0.1" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Koolhydraten (g) per 100g</span>
          <input v-model.number="form.koolhydratenPer100g" type="number" step="0.1" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Winkelcategorie (optioneel, voor sortering boodschappenlijst)</span>
        <input v-model="form.winkelCategorie" placeholder="bv. Zuivel, eieren" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Allergenen (optioneel, komma-gescheiden)</span>
        <input v-model="allergenenInput" placeholder="gluten, noten" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="form.basisvoorraad" class="size-4 accent-primary" />
        Basisvoorraad (staat meestal al in huis, standaard uitgevinkt op de boodschappenlijst)
      </label>

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

const form = reactive({
  naam: "",
  kcalPer100g: null,
  eiwitPer100g: null,
  vetPer100g: null,
  koolhydratenPer100g: null,
  winkelCategorie: "",
  basisvoorraad: false
});
const allergenenInput = ref("");
const error = ref("");
const success = ref(false);
const loading = ref(false);
const filledFromAh = ref(false);

const ahQuery = ref("");
const ahResults = ref<any[]>([]);
const ahLoading = ref(false);
const ahError = ref("");
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let requestId = 0;

watch(ahQuery, (q) => {
  clearTimeout(debounceTimer);
  const trimmed = q.trim();
  filledFromAh.value = false;

  if (trimmed.length < 2) {
    ahResults.value = [];
    ahLoading.value = false;
    ahError.value = "";
    return;
  }

  ahLoading.value = true;
  ahError.value = "";
  debounceTimer = setTimeout(async () => {
    const myRequestId = ++requestId;
    try {
      const res = await $fetch<any[]>("/api/ingredients/search", { params: { q: trimmed } });
      if (myRequestId !== requestId) return;
      ahResults.value = res;
    } catch (e: any) {
      if (myRequestId !== requestId) return;
      ahResults.value = [];
      ahError.value = e?.data?.statusMessage ?? "Zoeken bij Albert Heijn mislukt";
    } finally {
      if (myRequestId === requestId) ahLoading.value = false;
    }
  }, 400);
});

function selectAhProduct(p: any) {
  form.naam = p.naam;
  form.kcalPer100g = p.kcalPer100g;
  form.eiwitPer100g = p.eiwitPer100g;
  form.vetPer100g = p.vetPer100g;
  form.koolhydratenPer100g = p.koolhydratenPer100g;
  form.winkelCategorie = p.winkelCategorie ?? "";
  filledFromAh.value = true;
  ahResults.value = [];
  ahQuery.value = "";
}

async function submit() {
  loading.value = true;
  error.value = "";
  success.value = false;
  try {
    await $fetch("/api/ingredients" as any, {
      method: "POST",
      body: {
        ...form,
        allergenen: allergenenInput.value.split(",").map((a) => a.trim()).filter(Boolean)
      }
    });
    success.value = true;
    filledFromAh.value = false;
    form.naam = "";
    form.kcalPer100g = null as any;
    form.eiwitPer100g = null as any;
    form.vetPer100g = null as any;
    form.koolhydratenPer100g = null as any;
    form.winkelCategorie = "";
    form.basisvoorraad = false;
    allergenenInput.value = "";
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
