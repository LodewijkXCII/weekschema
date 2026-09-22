<template>
  <FormField label="Naam">
    <input v-model="profile.naam" :placeholder="namePlaceholder" class="form-input" />
  </FormField>
  <div class="grid grid-cols-2 gap-3">
    <FormField label="Kcal">
      <input v-model.number="profile.maxKcal" type="number" class="form-input tabular-nums" />
    </FormField>
    <FormField label="Eiwit (g)">
      <input v-model.number="profile.maxEiwit" type="number" class="form-input tabular-nums" />
    </FormField>
    <FormField label="Vet (g)">
      <input v-model.number="profile.maxVet" type="number" class="form-input tabular-nums" />
    </FormField>
    <FormField label="Koolhydraten (g)">
      <input v-model.number="profile.maxKoolhydraten" type="number" class="form-input tabular-nums" />
    </FormField>
  </div>
</template>

<script setup lang="ts">
defineProps<{ namePlaceholder?: string }>();
const profile = defineModel<{
  naam: string;
  maxKcal: number;
  maxEiwit: number;
  maxVet: number;
  maxKoolhydraten: number;
}>({ required: true });
</script>
