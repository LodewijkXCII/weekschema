<template>
  <div class="mx-auto flex min-h-full max-w-[380px] flex-col justify-center px-4 py-10">
    <div class="mb-6 flex flex-col items-center gap-3 text-center">
      <span class="bg-hero text-primary-foreground grid size-12 place-items-center rounded-2xl">
        <Leaf class="size-6" />
      </span>
      <h1 class="font-display text-2xl font-bold text-foreground">Inloggen</h1>
    </div>
    <form class="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft" @submit.prevent="submit">
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">E-mailadres</span>
        <input v-model="email" type="email" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-muted-foreground">Wachtwoord</span>
        <input v-model="password" type="password" required class="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <button type="submit" class="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" :disabled="loading">
        Inloggen
      </button>
    </form>
    <p class="mt-3 text-center text-sm text-muted-foreground">
      Nog geen account? <NuxtLink to="/register" class="font-medium text-primary hover:underline">Registreer hier</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { Leaf } from "lucide-vue-next";

const authClient = useAuthClient();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  error.value = "";
  const { error: err } = await authClient.signIn.email({ email: email.value, password: password.value });
  loading.value = false;
  if (err) {
    error.value = err.message ?? "Inloggen mislukt";
    return;
  }
  await navigateTo("/");
}
</script>
