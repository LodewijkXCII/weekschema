<template>
  <div class="h-dvh overflow-hidden bg-background">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { KIOSK_THEME_INIT_SCRIPT } from "~/composables/useKioskTheme";

useHead({
  script: [{ innerHTML: KIOSK_THEME_INIT_SCRIPT, tagPosition: "head" }]
});
</script>
