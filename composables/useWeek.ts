import { WEEK_DAGEN } from "./useMealMoments";

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

// Leest een ?week=YYYY-MM-DD query-parameter uit, anders de huidige week.
export function weekStartFromQuery(week: unknown) {
  return typeof week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(week)
    ? new Date(week + "T00:00:00")
    : mondayOf(new Date());
}

export function dateForDag(weekStart: Date, dagKey: string) {
  const idx = WEEK_DAGEN.findIndex((d) => d.key === dagKey);
  const d = new Date(weekStart);
  d.setDate(d.getDate() + idx);
  return d;
}

export function formatDayDate(d: Date) {
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}
