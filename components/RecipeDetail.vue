<template>
  <Teleport to="body">
    <div v-if="recipe" class="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-[2px]" @click="$emit('close')">
      <aside class="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card p-5 shadow-lift" @click.stop>
        <button type="button" class="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary" @click="$emit('close')">
          <X class="size-4" />
        </button>

        <div class="relative overflow-hidden rounded-2xl">
          <RecipeThumb :recipe="recipe" />
          <label class="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card/90 px-2 py-1 text-xs font-medium">
            <Camera class="size-3.5" /> {{ recipe.afbeeldingUrl ? "Foto wijzigen" : "Foto toevoegen" }}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="onFile" />
          </label>
        </div>

        <p v-if="uploadError" class="mt-2 text-sm text-destructive">{{ uploadError }}</p>

        <div class="mt-3 flex items-start justify-between gap-2">
          <h2 class="font-display text-xl font-bold">{{ recipe.naam }}</h2>
          <div class="flex shrink-0 gap-1.5">
            <NuxtLink
              :to="`/recipes/${recipe.id}/edit`"
              class="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              title="Bewerken"
            >
              <Pencil class="size-4" />
            </NuxtLink>
            <button
              type="button"
              class="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors"
              :class="recipe.favoriet ? 'border-accent text-accent' : 'hover:text-foreground'"
              title="Favoriet"
              @click="toggleFavoriet"
            >
              <Star class="size-4" :fill="recipe.favoriet ? 'currentColor' : 'none'" />
            </button>
          </div>
        </div>
        <p class="mt-1 mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground uppercase">{{ RECIPE_CATEGORIE_LABELS[recipe.categorie] }}</span>
          · {{ recipe.porties }} portie(s)
        </p>

        <RecipeTags :tags="recipe.tags" class="mb-2" />
        <div v-if="allergenen.length" class="mb-2.5 flex flex-wrap gap-1">
          <span v-for="a in allergenen" :key="a" class="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
            <TriangleAlert class="size-3" /> {{ a }}
          </span>
        </div>

        <div class="mb-3 flex gap-2">
          <FilterChip :active="recipe.mijnReactie === 1" class="gap-1.5" @click="react(1)">
            <ThumbsUp class="size-3.5" /> {{ recipe.duimpjesOmhoog ?? 0 }}
          </FilterChip>
          <FilterChip :active="recipe.mijnReactie === -1" class="gap-1.5" @click="react(-1)">
            <ThumbsDown class="size-3.5" /> {{ recipe.duimpjesOmlaag ?? 0 }}
          </FilterChip>
        </div>

        <div class="flex gap-4 rounded-2xl border border-border bg-background/60 p-3">
          <div class="flex flex-col items-center text-xs text-muted-foreground">
            <strong class="text-base font-display" style="color:var(--kcal)">{{ Math.round(perPortie.kcal) }}</strong>kcal
          </div>
          <div class="flex flex-col items-center text-xs text-muted-foreground">
            <strong class="text-base font-display" style="color:var(--protein)">{{ Math.round(perPortie.eiwit) }}g</strong>eiwit
          </div>
          <div class="flex flex-col items-center text-xs text-muted-foreground">
            <strong class="text-base font-display" style="color:var(--carbs)">{{ Math.round(perPortie.kh) }}g</strong>kh
          </div>
          <div class="flex flex-col items-center text-xs text-muted-foreground">
            <strong class="text-base font-display" style="color:var(--fat)">{{ Math.round(perPortie.vet) }}g</strong>vet
          </div>
        </div>
        <p class="mt-1 text-[11px] text-muted-foreground">per portie</p>

        <div class="mt-5 mb-2 flex items-center justify-between">
          <h3 class="text-sm font-display font-semibold">Ingrediënten</h3>
          <div class="flex items-center gap-1.5">
            <button type="button" class="grid size-7 place-items-center rounded-lg border border-border hover:bg-secondary" @click="gewenstePorties = Math.max(1, gewenstePorties - 1)">
              <Minus class="size-3.5" />
            </button>
            <span class="min-w-[70px] text-center text-xs tabular-nums">{{ gewenstePorties }} portie(s)</span>
            <button type="button" class="grid size-7 place-items-center rounded-lg border border-border hover:bg-secondary" @click="gewenstePorties++">
              <Plus class="size-3.5" />
            </button>
          </div>
        </div>
        <ul class="space-y-1 pl-1 text-sm">
          <li v-for="ri in recipe.ingredients" :key="ri.id ?? ri.ingredient.id" class="flex justify-between">
            <span>{{ ri.ingredient.naam }}</span>
            <span class="tabular-nums text-muted-foreground">{{ formatHoeveelheid(ri) }}</span>
          </li>
        </ul>

        <div class="mt-5 mb-2 flex items-center justify-between">
          <h3 class="text-sm font-display font-semibold">Bereiding</h3>
          <button v-if="stappen.length > 1" type="button" class="rounded-lg border border-border px-2 py-1 text-[11px] font-medium hover:bg-secondary" @click="kookModus = !kookModus">
            {{ kookModus ? "Gewone weergave" : "👨‍🍳 Kook-modus" }}
          </button>
        </div>
        <p v-if="!recipe.bereiding" class="text-sm text-muted-foreground">Geen bereidingswijze toegevoegd.</p>
        <ul v-else-if="kookModus" class="space-y-2">
          <li v-for="(stap, i) in stappen" :key="i" class="flex items-start gap-2 text-sm">
            <label class="flex cursor-pointer items-start gap-2">
              <input type="checkbox" v-model="afgevinkt[i]" class="mt-0.5 size-4 accent-primary" />
              <span :class="afgevinkt[i] ? 'text-muted-foreground line-through' : ''">{{ stap }}</span>
            </label>
          </li>
        </ul>
        <p v-else class="text-sm leading-relaxed whitespace-pre-wrap">{{ recipe.bereiding }}</p>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Camera, Star, Pencil, TriangleAlert, ThumbsUp, ThumbsDown, Minus, Plus } from "lucide-vue-next";
import { RECIPE_CATEGORIE_LABELS } from "~/composables/useMealMoments";
import { INGREDIENT_UNITS, type IngredientUnitKey } from "~/composables/useIngredientUnits";
import { recipePerPortie } from "~/composables/useMacros";

const props = defineProps<{ recipe: any | null }>();
const emit = defineEmits<{ (e: "close"): void; (e: "updated", recipe: any): void }>();

const uploadError = ref("");
const gewenstePorties = ref(1);
const kookModus = ref(false);
const afgevinkt = ref<boolean[]>([]);

watch(
  () => props.recipe?.id,
  () => {
    gewenstePorties.value = props.recipe?.porties || 1;
    kookModus.value = false;
  },
  { immediate: true }
);

const schaal = computed(() => gewenstePorties.value / (props.recipe?.porties || 1));

// Toont de hoeveelheid in de eenheid waarin 'm ook echt is ingevoerd (bv.
// "2 eetlepel"), niet altijd omgerekend naar gram -- dat is precies wat je
// tijdens het koken wil zien. Oudere recepten (van vóór dit veld bestond)
// hebben geen hoeveelheid/eenheid opgeslagen en tonen dan gewoon grammen.
function formatHoeveelheid(ri: any) {
  const eenheid: IngredientUnitKey = ri.eenheid ?? "gram";
  const basis = ri.hoeveelheid ?? ri.hoeveelheidGram;
  const geschaald = basis * schaal.value;

  if (eenheid === "gram") return `${Math.round(geschaald)}g`;

  const label = INGREDIENT_UNITS.find((u) => u.key === eenheid)?.label ?? eenheid;
  const afgerond = Math.round(geschaald * 10) / 10;
  return `${afgerond} ${label}`;
}

const stappen = computed<string[]>(() =>
  ((props.recipe?.bereiding as string | undefined) ?? "")
    .split("\n")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)
);

watch(stappen, (list) => {
  afgevinkt.value = list.map(() => false);
});

const allergenen = computed(() => {
  const set = new Set<string>();
  for (const ri of props.recipe?.ingredients ?? []) {
    for (const a of ri.ingredient?.allergenen ?? []) set.add(a);
  }
  return [...set];
});

const perPortie = computed(() => recipePerPortie(props.recipe));

async function toggleFavoriet() {
  if (!props.recipe) return;
  const updated = await $fetch(`/api/recipes/${props.recipe.id}`, {
    method: "PATCH",
    body: { favoriet: !props.recipe.favoriet }
  });
  emit("updated", updated);
}

async function react(waarde: -1 | 1) {
  if (!props.recipe) return;
  const nieuweWaarde = props.recipe.mijnReactie === waarde ? 0 : waarde;
  const result = await $fetch(`/api/recipes/${props.recipe.id}/reactions`, {
    method: "POST",
    body: { waarde: nieuweWaarde }
  });
  emit("updated", { ...props.recipe, ...result });
}

async function onFile(e: Event) {
  uploadError.value = "";
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !props.recipe) return;

  const body = new FormData();
  body.append("file", file);
  try {
    const updated = await $fetch(`/api/recipes/${props.recipe.id}/image`, { method: "POST", body });
    emit("updated", updated);
  } catch (err: any) {
    uploadError.value = err?.data?.statusMessage ?? "Uploaden mislukt";
  } finally {
    input.value = "";
  }
}
</script>
