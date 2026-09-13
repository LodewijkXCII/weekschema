<template>
  <div class="mx-auto flex min-h-full max-w-[420px] flex-col justify-center px-4 py-10">
    <div class="mb-6 flex flex-col items-center gap-3 text-center">
      <span class="bg-hero text-primary-foreground grid size-12 place-items-center rounded-2xl">
        <Leaf class="size-6" />
      </span>
      <h1 class="font-display text-2xl font-bold text-foreground">Account aanmaken</h1>
    </div>
    <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="submit">
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Naam</span>
        <input v-model="name" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">E-mailadres</span>
        <input v-model="email" type="email" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Wachtwoord</span>
        <input v-model="password" type="password" minlength="8" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <hr class="border-border" />

      <p class="text-xs text-muted-foreground">
        Ben jij de eerste van jullie twee? Maak een nieuw huishouden aan. Sluit je partner later aan, gebruik dan de
        uitnodigingscode hieronder.
      </p>
      <div class="flex gap-4">
        <label class="flex items-center gap-1.5 text-sm">
          <input type="radio" value="create" v-model="mode" class="accent-primary" /> Nieuw huishouden
        </label>
        <label class="flex items-center gap-1.5 text-sm">
          <input type="radio" value="join" v-model="mode" class="accent-primary" /> Uitnodigingscode
        </label>
      </div>
      <label v-if="mode === 'create'" class="block">
        <span class="text-xs font-medium text-muted-foreground">Naam huishouden</span>
        <input v-model="householdName" placeholder="bijv. Thuis" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label v-else class="block">
        <span class="text-xs font-medium text-muted-foreground">Uitnodigingscode</span>
        <input v-model="inviteCode" placeholder="bijv. 7QQ2LK" class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <button type="submit" class="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading">
        Account aanmaken
      </button>
    </form>
    <p class="mt-3 text-center text-sm text-muted-foreground">
      Heb je al een account? <NuxtLink to="/login" class="font-medium text-primary hover:underline">Log hier in</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { Leaf } from "lucide-vue-next";

const authClient = useAuthClient();
const name = ref("");
const email = ref("");
const password = ref("");
const mode = ref<"create" | "join">("create");
const householdName = ref("");
const inviteCode = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  error.value = "";

  const { error: signUpError } = await authClient.signUp.email({
    name: name.value,
    email: email.value,
    password: password.value
  });
  if (signUpError) {
    loading.value = false;
    error.value = signUpError.message ?? "Registreren mislukt";
    return;
  }

  try {
    if (mode.value === "create") {
      await $fetch("/api/household/create" as any, {
        method: "POST",
        body: { naam: householdName.value || "Ons huishouden" }
      });
    } else {
      await $fetch("/api/household/join" as any, {
        method: "POST",
        body: { inviteCode: inviteCode.value }
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
