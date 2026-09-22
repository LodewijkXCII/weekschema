<template>
  <div class="mx-auto max-w-[640px] px-4 py-6 lg:px-6">
    <PageHeader :icon="Pencil" title="Gerecht bewerken" :subtitle="form?.naam || '…'">
      <NuxtLink to="/recipes" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
        <ArrowLeft class="size-4" /> Terug naar recepten
      </NuxtLink>
    </PageHeader>

    <div v-if="!loaded" class="text-sm text-muted-foreground">Laden…</div>
    <p v-else-if="!form" class="text-sm text-destructive">{{ error }}</p>

    <RecipeForm v-else v-model="form" :loading="loading" :error="error" photo-label="Nieuwe foto (optioneel)" @submit="submit">
      <template #submit><Check class="size-4" /> Wijzigingen opslaan</template>
    </RecipeForm>
  </div>
</template>

<script setup lang="ts">
import { Pencil, ArrowLeft, Check } from "lucide-vue-next";
import { recipeFormFrom, recipePayload, uploadRecipePhoto, type RecipeFormState } from "~/composables/useRecipeForm";

const route = useRoute();
const recipeId = route.params.id as string;

const form = ref<RecipeFormState | null>(null);
const error = ref("");
const loading = ref(false);
const loaded = ref(false);

onMounted(async () => {
  const allRecipes = await $fetch<any[]>("/api/recipes" as any);
  const recipe = allRecipes.find((r) => r.id === recipeId);
  if (recipe) form.value = recipeFormFrom(recipe);
  else error.value = "Recept niet gevonden";
  loaded.value = true;
});

async function submit() {
  if (!form.value) return;
  loading.value = true;
  error.value = "";
  try {
    await $fetch(`/api/recipes/${recipeId}`, { method: "PATCH", body: recipePayload(form.value) });
    if (form.value.photo) await uploadRecipePhoto(recipeId, form.value.photo);
    await navigateTo("/recipes");
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
