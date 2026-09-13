<template>
  <div class="mx-auto max-w-[640px] px-4 py-6 lg:px-6">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="bg-hero text-primary-foreground grid size-11 place-items-center rounded-2xl">
          <ChefHat class="size-5" />
        </span>
        <div>
          <h1 class="font-display text-2xl font-bold text-foreground">Gerecht toevoegen</h1>
          <p class="text-sm text-muted-foreground">Eigen recepten met macro's, ingrediënten en bereiding</p>
        </div>
      </div>
      <NuxtLink to="/recipes" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
        <ArrowLeft class="size-4" /> Terug naar recepten
      </NuxtLink>
    </header>

    <button type="button" class="mb-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary" @click="showImport = !showImport">
      <component :is="showImport ? X : Download" class="size-4" />
      {{ showImport ? "Handmatig invoeren" : "Recept importeren (URL / tekst / foto)" }}
    </button>

    <div v-if="showImport" class="mb-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <p class="mb-2.5 text-sm font-medium">Recept importeren</p>
      <div class="mb-2.5 flex gap-2">
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          :class="importMode === 'url' ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
          @click="importMode = 'url'"
        ><Link2 class="mr-1 inline size-3.5" />URL</button>
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          :class="importMode === 'text' ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
          @click="importMode = 'text'"
        ><ClipboardPaste class="mr-1 inline size-3.5" />Tekst</button>
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          :class="importMode === 'photo' ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
          @click="importMode = 'photo'"
        ><Camera class="mr-1 inline size-3.5" />Foto</button>
      </div>

      <label v-if="importMode === 'url'" class="mb-2.5 block">
        <span class="text-xs font-medium text-muted-foreground">Link naar het recept</span>
        <input v-model="importUrl" placeholder="https://..." class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label v-else-if="importMode === 'text'" class="mb-2.5 block">
        <span class="text-xs font-medium text-muted-foreground">Geplakte tekst (bv. een Instagram-bijschrift)</span>
        <textarea v-model="importText" rows="5" placeholder="Plak hier de receptbeschrijving…" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label v-else class="mb-2.5 block">
        <span class="text-xs font-medium text-muted-foreground">Foto van het recept</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="mt-1 block text-sm" @change="onImportFile" />
      </label>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        :disabled="importing || !canImport"
        @click="runImport"
      >
        {{ importing ? "Bezig met importeren…" : "Importeer" }}
      </button>
      <p v-if="importError" class="mt-2 text-sm text-destructive">{{ importError }}</p>
    </div>

    <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="submit">
      <p v-if="importedUnmatchedCount > 0" class="text-xs text-muted-foreground">
        ✓ Geïmporteerd. {{ importedUnmatchedCount }} ingrediënt(en) niet automatisch herkend -- kies hieronder
        handmatig het juiste ingrediënt, of voeg het eerst toe via
        <NuxtLink to="/ingredients/new" class="font-medium text-primary hover:underline">Ingrediënt toevoegen</NuxtLink>.
      </p>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Naam</span>
        <input v-model="naam" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <div>
        <span class="text-xs font-medium text-muted-foreground">Categorie</span>
        <div class="mt-1 flex flex-wrap gap-1.5">
          <button
            v-for="c in categorieen"
            :key="c"
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            :class="categorie === c ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary'"
            @click="categorie = c"
          >{{ RECIPE_CATEGORIE_LABELS[c] }}</button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Aantal porties</span>
          <input v-model.number="porties" type="number" min="1" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Foto (optioneel)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="mt-1.5 block text-sm" @change="onFile" />
        </label>
      </div>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Bereidingswijze (optioneel)</span>
        <textarea v-model="bereiding" rows="4" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Tags (optioneel, komma-gescheiden, bv. snel, vegetarisch)</span>
        <input v-model="tagsInput" placeholder="snel, vegetarisch" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="favoriet" class="size-4 accent-primary" />
        <Star class="size-3.5 text-accent" :fill="favoriet ? 'currentColor' : 'none'" /> Markeer als favoriet
      </label>

      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ingrediënten</span>
          <button type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" @click="rows.push({ ingredientId: '', hoeveelheidGram: 100 })">
            <Plus class="size-3.5" /> Regel
          </button>
        </div>
        <div class="mt-2 space-y-2">
          <div v-for="(row, i) in rows" :key="i">
            <div class="flex items-end gap-2">
              <label class="block flex-[2]">
                <span class="text-xs font-medium text-muted-foreground">Ingrediënt</span>
                <select v-model="row.ingredientId" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="" disabled>Kies...</option>
                  <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">{{ ing.naam }}</option>
                </select>
              </label>
              <label class="block flex-1">
                <span class="text-xs font-medium text-muted-foreground">Gram</span>
                <input v-model.number="row.hoeveelheidGram" type="number" min="1" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <button type="button" aria-label="Regel verwijderen" class="grid size-9 shrink-0 place-items-center text-muted-foreground hover:text-destructive" @click="rows.splice(i, 1)">
                <X class="size-4" />
              </button>
            </div>
            <p v-if="row._importNaam" class="mt-0.5 text-[11px] text-muted-foreground">
              Geïmporteerd als "{{ row._importNaam }}" -- niet automatisch gevonden.
            </p>
          </div>
        </div>
      </div>

      <p v-if="ingredients.length === 0" class="text-sm text-muted-foreground">
        Nog geen ingrediënten in je bibliotheek. <NuxtLink to="/ingredients/new" class="font-medium text-primary hover:underline">Voeg er eerst een toe</NuxtLink>.
      </p>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <button
        type="submit"
        class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        :disabled="loading || rows.length === 0"
      >
        <Plus class="size-4" /> Recept opslaan
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ChefHat, ArrowLeft, Download, X, Link2, ClipboardPaste, Camera, Star, Plus } from "lucide-vue-next";
import { RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";

const categorieen = ["ontbijt", "lunch", "diner", "tussendoor"] as const;

const naam = ref("");
const categorie = ref<(typeof categorieen)[number]>("diner");
const porties = ref(1);
const bereiding = ref("");
const tagsInput = ref("");
const favoriet = ref(false);
const rows = ref<{ ingredientId: string; hoeveelheidGram: number; _importNaam?: string | null }[]>([
  { ingredientId: "", hoeveelheidGram: 100 }
]);
const ingredients = ref<any[]>([]);
const error = ref("");
const loading = ref(false);
const photo = ref<File | null>(null);

const showImport = ref(false);
const importMode = ref<"url" | "text" | "photo">("url");
const importUrl = ref("");
const importText = ref("");
const importPhoto = ref<File | null>(null);
const importing = ref(false);
const importError = ref("");
const importedUnmatchedCount = ref(0);

const canImport = computed(() => {
  if (importMode.value === "url") return importUrl.value.trim().length > 0;
  if (importMode.value === "text") return importText.value.trim().length > 0;
  return importPhoto.value !== null;
});

onMounted(async () => {
  ingredients.value = await $fetch("/api/ingredients" as any);
});

function onFile(e: Event) {
  photo.value = (e.target as HTMLInputElement).files?.[0] ?? null;
}

function onImportFile(e: Event) {
  importPhoto.value = (e.target as HTMLInputElement).files?.[0] ?? null;
}

async function runImport() {
  importing.value = true;
  importError.value = "";
  importedUnmatchedCount.value = 0;
  try {
    let result: any;
    if (importMode.value === "photo") {
      const body = new FormData();
      body.append("file", importPhoto.value!);
      result = await $fetch("/api/recipes/extract" as any, { method: "POST", body });
    } else {
      result = await $fetch("/api/recipes/extract" as any, {
        method: "POST",
        body: importMode.value === "url" ? { url: importUrl.value.trim() } : { text: importText.value.trim() }
      });
    }

    naam.value = result.naam;
    categorie.value = result.categorie;
    porties.value = result.porties || 1;
    bereiding.value = result.bereiding ?? "";
    rows.value = result.ingredienten.map((ing: any) => ({
      ingredientId: ing.ingredientId ?? "",
      hoeveelheidGram: ing.hoeveelheidGram,
      _importNaam: ing.ingredientId ? null : ing.naam
    }));
    importedUnmatchedCount.value = result.ingredienten.filter((i: any) => !i.ingredientId).length;
    showImport.value = false;
  } catch (e: any) {
    importError.value = e?.data?.statusMessage ?? "Importeren mislukt";
  } finally {
    importing.value = false;
  }
}

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const recipe = await $fetch<any>("/api/recipes" as any, {
      method: "POST",
      body: {
        naam: naam.value,
        categorie: categorie.value,
        porties: porties.value,
        bereiding: bereiding.value,
        favoriet: favoriet.value,
        tags: tagsInput.value.split(",").map((t) => t.trim()).filter(Boolean),
        ingredienten: rows.value
      }
    });

    if (photo.value) {
      const body = new FormData();
      body.append("file", photo.value);
      await $fetch(`/api/recipes/${recipe.id}/image`, { method: "POST", body });
    }

    await navigateTo("/recipes");
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
