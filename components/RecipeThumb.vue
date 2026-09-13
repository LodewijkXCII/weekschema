<template>
  <div class="recipe-thumb" :class="{ compact, fill }">
    <img v-if="recipe.afbeeldingUrl" :src="recipe.afbeeldingUrl" :alt="recipe.naam" />
    <div v-else class="recipe-thumb-placeholder" :style="{ background: gradient }">
      <span>{{ emoji }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: { naam: string; afbeeldingUrl?: string | null };
  compact?: boolean;
  // Vult 100% breedte EN hoogte van de ouder, zonder eigen aspect-ratio --
  // voor gebruik in een al vierkant vakje (weekbord-slots).
  fill?: boolean;
}>();

// Geen foto? Dan een deterministisch emoji + kleurverloop op basis van de
// naam, zodat elk recept een herkenbaar, aantrekkelijk plaatje heeft zonder
// dat we van internet afhankelijk zijn.
const EMOJIS = [
  "🍳", "🥗", "🍲", "🍛", "🍜", "🥘", "🍝", "🥪", "🌯", "🍱",
  "🥞", "🧇", "🥑", "🥦", "🍤", "🐟", "🍗", "🥕", "🧆", "🍚"
];
const GRADIENTS = [
  "linear-gradient(135deg, #f6d365, #fda085)",
  "linear-gradient(135deg, #a8e6cf, #3c6e52)",
  "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
  "linear-gradient(135deg, #f9d423, #e78c3d)",
  "linear-gradient(135deg, #84fab0, #8fd3f4)",
  "linear-gradient(135deg, #ffecd2, #fcb69f)",
  "linear-gradient(135deg, #c2e59c, #64b3f4)",
  "linear-gradient(135deg, #f7797d, #fbd786)"
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const seed = hash(props.recipe.naam || "recept");
const emoji = EMOJIS[seed % EMOJIS.length];
const gradient = GRADIENTS[Math.floor(seed / EMOJIS.length) % GRADIENTS.length];
</script>

<style scoped>
.recipe-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
}
.recipe-thumb.compact {
  /* Vaste hoogte i.p.v. aspect-ratio: bij een breed kolombreedte (full-page
     weekbord) zou aspect-ratio de hoogte laten meegroeien met de
     kolombreedte, waardoor het weekbord van formaat kan veranderen. */
  height: 34px;
  border-radius: 6px;
}
.recipe-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.recipe-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.recipe-thumb-placeholder span {
  font-size: 2rem;
}
.recipe-thumb.compact .recipe-thumb-placeholder span {
  font-size: 1.2rem;
}
.recipe-thumb.fill {
  height: 100%;
  aspect-ratio: unset;
}
</style>
