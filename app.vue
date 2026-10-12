<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Elke pagina zet zelf een titel via useHead({ title }); zonder titel
// blijft het gewoon "Weekschema".
useHead({
  titleTemplate: (title) => (title ? `${title} · Weekschema` : "Weekschema")
});
</script>
