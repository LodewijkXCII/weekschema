<template>
  <div class="mx-auto max-w-[640px] px-4 py-6 lg:px-6">
    <PageHeader :icon="ChefHat" title="Gerecht toevoegen" subtitle="Eigen recepten met macro's, ingrediënten en bereiding">
      <NuxtLink to="/recipes" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
        <ArrowLeft class="size-4" /> Terug naar recepten
      </NuxtLink>
    </PageHeader>

    <button type="button" class="mb-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary" @click="showImport = !showImport">
      <component :is="showImport ? X : Download" class="size-4" />
      {{ showImport ? "Handmatig invoeren" : "Recept importeren (URL / tekst / foto)" }}
    </button>

    <RecipeImportPanel v-if="showImport" class="mb-4" @imported="onImported" />

    <RecipeForm v-model="form" :loading="loading" :error="error" @submit="submit">
      <template #notice>
        <p v-if="importedUnmatchedCount > 0" class="text-xs text-muted-foreground">
          ✓ Geïmporteerd. {{ importedUnmatchedCount }} ingrediënt(en) niet automatisch herkend -- kies hieronder
          handmatig het juiste ingrediënt, of voeg het eerst toe via
          <NuxtLink to="/ingredients/new" class="font-medium text-primary hover:underline">Ingrediënt toevoegen</NuxtLink>.
        </p>
      </template>
      <template #submit><Plus class="size-4" /> Recept opslaan</template>
    </RecipeForm>
  </div>
</template>

<script setup lang="ts">
import { ChefHat, ArrowLeft, Download, X, Plus } from "lucide-vue-next";
import { emptyRecipeForm, recipePayload, uploadRecipePhoto } from "~/composables/useRecipeForm";

const form = ref(emptyRecipeForm());
const error = ref("");
const loading = ref(false);

const showImport = ref(false);
const importedUnmatchedCount = ref(0);

function onImported(result: any) {
  form.value.naam = result.naam;
  form.value.categorie = result.categorie;
  form.value.porties = result.porties || 1;
  form.value.bereiding = result.bereiding ?? "";
  form.value.rows = result.ingredienten.map((ing: any) => ({
    ingredientId: ing.ingredientId ?? "",
    hoeveelheid: ing.hoeveelheidGram,
    eenheid: "gram" as const,
    _importNaam: ing.ingredientId ? null : ing.naam,
    _suggestieId: ing.suggestieId ?? null,
    _suggestieNaam: ing.suggestieNaam ?? null
  }));
  importedUnmatchedCount.value = result.ingredienten.filter((i: any) => !i.ingredientId).length;
  showImport.value = false;
}

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const recipe = await $fetch<any>("/api/recipes" as any, { method: "POST", body: recipePayload(form.value) });
    if (form.value.photo) await uploadRecipePhoto(recipe.id, form.value.photo);
    await navigateTo("/recipes");
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
