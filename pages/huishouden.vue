<template>
  <div class="mx-auto flex min-h-full max-w-[420px] flex-col justify-center px-4 py-10">
    <div class="mb-6 flex flex-col items-center gap-3 text-center">
      <span class="bg-hero text-primary-foreground grid size-12 place-items-center rounded-2xl">
        <Users class="size-6" />
      </span>
      <h1 class="font-display text-2xl font-bold text-foreground">
        {{ current ? "Ander huishouden" : "Huishouden kiezen" }}
      </h1>
    </div>
    <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="submit">
      <p v-if="current" class="text-sm text-muted-foreground">
        Je zit nu in <span class="font-medium text-foreground">{{ current.naam }}</span>. Met de uitnodigingscode van je
        partner stap je over naar diens huishouden.
      </p>
      <template v-else>
        <p class="text-sm text-muted-foreground">
          Je account is aangemaakt, maar je zit nog niet in een huishouden. Vul de uitnodigingscode van je partner in
          (te vinden bij Instellingen), of maak zelf een nieuw huishouden aan.
        </p>
        <div class="flex gap-4">
          <label class="flex items-center gap-1.5 text-sm">
            <input type="radio" value="join" v-model="mode" class="accent-primary" /> Uitnodigingscode
          </label>
          <label class="flex items-center gap-1.5 text-sm">
            <input type="radio" value="create" v-model="mode" class="accent-primary" /> Nieuw huishouden
          </label>
        </div>
      </template>

      <label v-if="mode === 'join'" class="block">
        <span class="text-xs font-medium text-muted-foreground">Uitnodigingscode</span>
        <input v-model="inviteCode" required placeholder="bijv. 7QQ2LK" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label v-else class="block">
        <span class="text-xs font-medium text-muted-foreground">Naam huishouden</span>
        <input v-model="householdName" placeholder="bijv. Thuis" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <button type="submit" class="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading">
        {{ mode === "join" ? "Aansluiten" : "Huishouden aanmaken" }}
      </button>
    </form>
    <p v-if="current" class="mt-3 text-center text-sm text-muted-foreground">
      <NuxtLink to="/settings" class="font-medium text-primary hover:underline">Terug naar instellingen</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { Users } from "lucide-vue-next";

const route = useRoute();
const mode = ref<"join" | "create">("join");
const inviteCode = ref("");
const householdName = ref("");
const error = ref(typeof route.query.fout === "string" ? route.query.fout : "");
const loading = ref(false);
// Het huidige huishouden, als de gebruiker er al in zit (via Instellingen hier
// gekomen om over te stappen). Dan alleen aansluiten, geen nieuw aanmaken.
const current = ref<{ naam: string } | null>(null);

onMounted(async () => {
  current.value = await $fetch<any>("/api/household" as any).catch(() => null);
});

async function submit() {
  if (current.value && !confirm(`Overstappen van "${current.value.naam}" naar een ander huishouden?`)) return;

  loading.value = true;
  error.value = "";
  try {
    if (mode.value === "join") {
      await $fetch<any>("/api/household/join" as any, { method: "POST", body: { inviteCode: inviteCode.value } });
    } else {
      await $fetch<any>("/api/household/create" as any, {
        method: "POST",
        body: { naam: householdName.value || "Ons huishouden" }
      });
    }
  } catch (e: any) {
    loading.value = false;
    error.value = e?.data?.statusMessage ?? "Huishouden koppelen mislukt";
    return;
  }

  loading.value = false;
  await navigateTo("/");
}
</script>
