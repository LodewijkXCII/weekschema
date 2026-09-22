<template>
  <div class="flex h-dvh flex-col bg-background">
    <header class="flex-none border-b border-border bg-card">
      <div class="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <NuxtLink to="/" class="flex items-center gap-3 no-underline">
          <span class="bg-hero text-primary-foreground grid size-10 place-items-center rounded-2xl">
            <Leaf class="size-5" />
          </span>
          <span class="font-display text-lg font-bold text-foreground">Weekschema</span>
        </NuxtLink>
        <nav class="bg-background flex flex-wrap items-center gap-1 rounded-xl border border-border p-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-colors"
            :class="isActive(item.to) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          >
            <component :is="item.icon" class="size-4" />
            {{ item.label }}
          </NuxtLink>
          <button
            v-if="session"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            @click="logout"
          >
            <LogOut class="size-4" /> Uitloggen
          </button>
        </nav>
      </div>
    </header>
    <main class="min-h-0 flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Leaf, CalendarDays, ShoppingCart, ChefHat, Beef, Settings, LogOut, TrendingUp, MonitorPlay } from "lucide-vue-next";

const route = useRoute();
const authClient = useAuthClient();
const session = ref(null as any);

const navItems = [
  { to: "/", label: "Week", icon: CalendarDays },
  { to: "/boodschappen", label: "Boodschappen", icon: ShoppingCart },
  { to: "/recipes", label: "Recepten", icon: ChefHat },
  { to: "/ingredients", label: "Ingrediënten", icon: Beef },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/kiosk", label: "Kiosk", icon: MonitorPlay },
  { to: "/settings", label: "Instellingen", icon: Settings }
];

function isActive(to: string) {
  return to === "/" ? route.path === "/" : route.path.startsWith(to);
}

async function loadSession() {
  const { data } = await authClient.getSession();
  session.value = data;
}
loadSession();

async function logout() {
  await authClient.signOut();
  await navigateTo("/login");
}
</script>
