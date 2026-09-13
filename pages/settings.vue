<template>
  <div class="mx-auto max-w-[560px] px-4 py-6 lg:px-6">
    <header class="mb-6 flex items-center gap-3">
      <span class="bg-hero text-primary-foreground grid size-11 place-items-center rounded-2xl">
        <SlidersHorizontal class="size-5" />
      </span>
      <h1 class="font-display text-2xl font-bold text-foreground">Instellingen</h1>
    </header>

    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium">Doelprofielen (dagelijkse maximale nutriënten)</p>
      <button type="button" class="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary" @click="addingNew = !addingNew">
        <component :is="addingNew ? X : Plus" class="size-4" /> Profiel
      </button>
    </div>
    <p class="mb-3 text-xs text-muted-foreground">
      Maak bijvoorbeeld een profiel "Ouders" en "Kinderen" met andere doelen, en wissel tussen profielen op het weekbord.
    </p>

    <div v-if="addingNew" class="mb-3 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Naam</span>
        <input v-model="newProfile.naam" placeholder="bv. Ouders" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Kcal</span>
          <input v-model.number="newProfile.maxKcal" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Eiwit (g)</span>
          <input v-model.number="newProfile.maxEiwit" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Vet (g)</span>
          <input v-model.number="newProfile.maxVet" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Koolhydraten (g)</span>
          <input v-model.number="newProfile.maxKoolhydraten" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>
      <p v-if="newError" class="text-sm text-destructive">{{ newError }}</p>
      <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading" @click="createProfile">
        Profiel aanmaken
      </button>
    </div>

    <div v-for="p in profiles" :key="p.id" class="mb-3 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Naam</span>
        <input v-model="p.naam" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Kcal</span>
          <input v-model.number="p.maxKcal" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Eiwit (g)</span>
          <input v-model.number="p.maxEiwit" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Vet (g)</span>
          <input v-model.number="p.maxVet" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-muted-foreground">Koolhydraten (g)</span>
          <input v-model.number="p.maxKoolhydraten" type="number" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>
      <p v-if="savedId === p.id" class="text-sm text-primary">Opgeslagen.</p>
      <p v-if="errorId === p.id" class="text-sm text-destructive">{{ errorMessage }}</p>
      <div class="flex gap-2">
        <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading" @click="saveProfile(p)">
          Opslaan
        </button>
        <button
          v-if="profiles.length > 1"
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          :disabled="loading"
          @click="deleteProfile(p)"
        >
          Verwijderen
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p class="mb-1.5 flex items-center gap-2 text-sm font-medium"><Users class="size-4 text-muted-foreground" /> Huishouden delen</p>
      <p class="text-sm text-muted-foreground">
        Geef deze code aan je partner om samen hetzelfde weekschema en dezelfde recepten te gebruiken.
      </p>
      <p v-if="household" class="mt-2 font-display text-xl font-bold tracking-widest">{{ household.inviteCode }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SlidersHorizontal, Plus, X, Users } from "lucide-vue-next";

const profiles = ref<any[]>([]);
const household = ref<any>(null);
const loading = ref(false);
const savedId = ref<string | null>(null);
const errorId = ref<string | null>(null);
const errorMessage = ref("");

const addingNew = ref(false);
const newProfile = reactive({ naam: "", maxKcal: 2000, maxEiwit: 120, maxVet: 70, maxKoolhydraten: 200 });
const newError = ref("");

onMounted(async () => {
  profiles.value = await $fetch("/api/targets" as any);
  household.value = await $fetch("/api/household" as any);
});

async function saveProfile(p: any) {
  loading.value = true;
  savedId.value = null;
  errorId.value = null;
  try {
    await $fetch(`/api/targets/${p.id}`, {
      method: "PATCH",
      body: {
        naam: p.naam,
        maxKcal: p.maxKcal,
        maxEiwit: p.maxEiwit,
        maxVet: p.maxVet,
        maxKoolhydraten: p.maxKoolhydraten
      }
    });
    savedId.value = p.id;
  } catch (e: any) {
    errorId.value = p.id;
    errorMessage.value = e?.data?.statusMessage ?? "Opslaan mislukt";
  } finally {
    loading.value = false;
  }
}

async function deleteProfile(p: any) {
  const ok = confirm(`Profiel "${p.naam}" verwijderen?`);
  if (!ok) return;
  loading.value = true;
  try {
    await $fetch(`/api/targets/${p.id}`, { method: "DELETE" });
    profiles.value = profiles.value.filter((x) => x.id !== p.id);
  } catch (e: any) {
    errorId.value = p.id;
    errorMessage.value = e?.data?.statusMessage ?? "Verwijderen mislukt";
  } finally {
    loading.value = false;
  }
}

async function createProfile() {
  newError.value = "";
  if (!newProfile.naam.trim()) {
    newError.value = "Naam is verplicht.";
    return;
  }
  loading.value = true;
  try {
    const created = await $fetch("/api/targets" as any, { method: "POST", body: { ...newProfile } });
    profiles.value.push(created);
    addingNew.value = false;
    newProfile.naam = "";
    newProfile.maxKcal = 2000;
    newProfile.maxEiwit = 120;
    newProfile.maxVet = 70;
    newProfile.maxKoolhydraten = 200;
  } catch (e: any) {
    newError.value = e?.data?.statusMessage ?? "Aanmaken mislukt";
  } finally {
    loading.value = false;
  }
}
</script>
