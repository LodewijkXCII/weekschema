<template>
  <div class="mx-auto max-w-[640px] px-4 py-6 lg:px-6">
    <PageHeader :icon="Pencil" title="Gerecht bewerken" :subtitle="form?.naam || '…'">
      <NuxtLink to="/recipes" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary">
        <ArrowLeft class="size-4" /> Terug naar recepten
      </NuxtLink>
    </PageHeader>

    <div v-if="!loaded" class="text-sm text-muted-foreground">Laden…</div>
    <p v-else-if="!form" class="text-sm text-destructive">{{ error }}</p>

    <RecipeForm v-else v-model="form" :recipe-id="recipeId" :loading="loading" :error="error" photo-label="Nieuwe foto (optioneel)" @submit="submit">
      <template #submit><Check class="size-4" /> Wijzigingen opslaan</template>
    </RecipeForm>

    <div v-if="form" class="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 p-4">
      <p class="text-sm text-muted-foreground">Recept dubbel ingevoerd of niet meer nodig?</p>
      <button
        type="button"
        :disabled="deleting"
        class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        @click="remove"
      >
        <Trash2 class="size-4" /> {{ deleting ? "Verwijderen…" : "Recept verwijderen" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil, ArrowLeft, Check, Trash2 } from "lucide-vue-next";
import { recipeFormFrom, recipePayload, uploadRecipePhoto, type RecipeFormState } from "~/composables/useRecipeForm";

useHead({ title: "Gerecht bewerken" });

const route = useRoute();
const recipeId = route.params.id as string;

const form = ref<RecipeFormState | null>(null);
const error = ref("");
const loading = ref(false);
const loaded = ref(false);
const deleting = ref(false);

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

async function remove() {
  if (!form.value) return;
  if (!confirm(`"${form.value.naam}" definitief verwijderen? Staat het nog ingepland op het weekbord, dan worden die vakjes leeg.`)) return;
  deleting.value = true;
  error.value = "";
  try {
    await $fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    await navigateTo("/recipes");
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Verwijderen mislukt";
  } finally {
    deleting.value = false;
  }
}
</script>
