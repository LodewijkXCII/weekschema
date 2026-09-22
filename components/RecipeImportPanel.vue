<template>
  <div class="rounded-3xl border border-border bg-card p-5 shadow-soft">
    <p class="mb-2.5 text-sm font-medium">Recept importeren</p>
    <div class="mb-2.5 flex gap-2">
      <FilterChip :active="mode === 'url'" @click="mode = 'url'"><Link2 class="size-3.5" />URL</FilterChip>
      <FilterChip :active="mode === 'text'" @click="mode = 'text'"><ClipboardPaste class="size-3.5" />Tekst</FilterChip>
      <FilterChip :active="mode === 'photo'" @click="mode = 'photo'"><Camera class="size-3.5" />Foto</FilterChip>
    </div>

    <FormField v-if="mode === 'url'" label="Link naar het recept" class="mb-2.5">
      <input v-model="url" placeholder="https://..." class="form-input" />
    </FormField>
    <FormField v-else-if="mode === 'text'" label="Geplakte tekst (bv. een Instagram-bijschrift)" class="mb-2.5">
      <textarea v-model="text" rows="5" placeholder="Plak hier de receptbeschrijving…" class="form-input" />
    </FormField>
    <label v-else class="mb-2.5 block">
      <span class="text-xs font-medium text-muted-foreground">Foto van het recept</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="mt-1 block text-sm" @change="onFile" />
    </label>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      :disabled="importing || !canImport"
      @click="runImport"
    >
      {{ importing ? "Bezig met importeren…" : "Importeer" }}
    </button>
    <p v-if="error" class="mt-2 text-sm text-destructive">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { Link2, ClipboardPaste, Camera } from "lucide-vue-next";

// Haalt een recept op via /api/recipes/extract (URL, geplakte tekst of foto)
// en geeft het ruwe resultaat door; de ouder vult er het formulier mee.
const emit = defineEmits<{ (e: "imported", result: any): void }>();

const mode = ref<"url" | "text" | "photo">("url");
const url = ref("");
const text = ref("");
const photo = ref<File | null>(null);
const importing = ref(false);
const error = ref("");

const canImport = computed(() => {
  if (mode.value === "url") return url.value.trim().length > 0;
  if (mode.value === "text") return text.value.trim().length > 0;
  return photo.value !== null;
});

function onFile(e: Event) {
  photo.value = (e.target as HTMLInputElement).files?.[0] ?? null;
}

async function runImport() {
  importing.value = true;
  error.value = "";
  try {
    let result: any;
    if (mode.value === "photo") {
      const body = new FormData();
      body.append("file", photo.value!);
      result = await $fetch<any>("/api/recipes/extract" as any, { method: "POST", body });
    } else {
      result = await $fetch<any>("/api/recipes/extract" as any, {
        method: "POST",
        body: mode.value === "url" ? { url: url.value.trim() } : { text: text.value.trim() }
      });
    }
    emit("imported", result);
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? "Importeren mislukt";
  } finally {
    importing.value = false;
  }
}
</script>
