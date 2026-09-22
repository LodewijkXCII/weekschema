<template>
  <div class="mx-auto max-w-[900px] px-4 py-6 lg:px-6">
    <PageHeader :icon="Beef" title="Ingrediënten" :subtitle="`${ingredients.length} in je bibliotheek`">
      <NuxtLink to="/ingredients/new" class="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90">
        <Plus class="size-4" /> Nieuw ingrediënt
      </NuxtLink>
    </PageHeader>

    <SearchInput v-model="search" placeholder="Zoek een ingrediënt…" class="mb-4" />

    <div v-if="loading" class="text-sm text-muted-foreground">Laden…</div>

    <div v-else class="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table class="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr class="bg-secondary/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <th class="p-3 text-left">Naam</th>
            <th class="p-3 text-right">Kcal</th>
            <th class="p-3 text-right">Eiwit</th>
            <th class="p-3 text-right">Vet</th>
            <th class="p-3 text-right">KH</th>
            <th class="p-3 text-left">Winkelcategorie</th>
            <th class="p-3 text-left">Allergenen</th>
            <th class="p-3 text-center">Basis</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ing in filtered" :key="ing.id" class="border-t border-border transition-colors hover:bg-secondary/40">
            <td class="p-3 font-medium">{{ ing.naam }}</td>
            <td class="p-3 text-right tabular-nums">{{ Math.round(ing.kcalPer100g) }}</td>
            <td class="p-3 text-right tabular-nums" style="color:var(--protein)">{{ ing.eiwitPer100g }}g</td>
            <td class="p-3 text-right tabular-nums" style="color:var(--fat)">{{ ing.vetPer100g }}g</td>
            <td class="p-3 text-right tabular-nums" style="color:var(--carbs)">{{ ing.koolhydratenPer100g }}g</td>
            <td class="p-3 text-muted-foreground">{{ ing.winkelCategorie || "—" }}</td>
            <td class="p-3">
              <span v-for="a in ing.allergenen ?? []" :key="a" class="mr-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">{{ a }}</span>
              <span v-if="!ing.allergenen?.length" class="text-muted-foreground">—</span>
            </td>
            <td class="p-3 text-center">
              <Check v-if="ing.basisvoorraad" class="mx-auto size-4 text-primary" />
            </td>
            <td class="p-3 text-right">
              <NuxtLink :to="`/ingredients/${ing.id}/edit`" class="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground no-underline transition-colors hover:text-foreground" title="Bewerken">
                <Pencil class="size-3.5" />
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="9" class="p-6 text-center text-sm text-muted-foreground">Geen ingrediënten gevonden.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Beef, Plus, Pencil, Check } from "lucide-vue-next";

const ingredients = ref<any[]>([]);
const loading = ref(true);
const search = ref("");

onMounted(async () => {
  ingredients.value = await $fetch<any>("/api/ingredients" as any);
  loading.value = false;
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  const sorted = [...ingredients.value].sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  if (!q) return sorted;
  return sorted.filter(
    (i) => i.naam.toLowerCase().includes(q) || (i.winkelCategorie ?? "").toLowerCase().includes(q)
  );
});
</script>
