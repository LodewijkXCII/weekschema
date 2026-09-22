const STORAGE_KEY = "weekschema-active-profile";
const DEFAULT_TARGETS = { maxKcal: 2000, maxEiwit: 120, maxVet: 70, maxKoolhydraten: 200 };

// Doelprofielen + het gekozen actieve profiel (onthouden in localStorage),
// gedeeld tussen weekbord en trends.
export function useTargetProfiles() {
  const targetProfiles = ref<any[]>([]);
  const activeProfileId = ref("");

  const targets = computed(
    () =>
      targetProfiles.value.find((t) => t.id === activeProfileId.value) ??
      targetProfiles.value[0] ??
      DEFAULT_TARGETS
  );

  async function loadTargets() {
    targetProfiles.value = await $fetch<any[]>("/api/targets" as any);
    const stored = localStorage.getItem(STORAGE_KEY);
    activeProfileId.value =
      stored && targetProfiles.value.some((t) => t.id === stored) ? stored : (targetProfiles.value[0]?.id ?? "");
  }

  watch(activeProfileId, (id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
  });

  return { targetProfiles, activeProfileId, targets, loadTargets };
}
