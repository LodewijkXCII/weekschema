// Gedeelde datum-helpers voor "welke week" -- gebruikt door het weekbord en
// de boodschappenlijst, die allebei over dezelfde week (maandag t/m zondag)
// moeten kunnen praten.
export function mondayOf(d: Date) {
  const date = new Date(d);
  const day = date.getDay() || 7;
  if (day !== 1) date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function formatWeekDate(d: Date) {
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}
