// Fallback voedingswaarden-bron voor generieke/onbewerkte ingrediënten (bv.
// "appel", "kipfilet rauw") die niet als concreet supermarktproduct bij
// Albert Heijn te vinden zijn. Gebruikt het Nederlands Voedingsstoffenbestand
// (NEVO, RIVM/Voedingscentrum) -- geen live API (die bestaat niet publiek),
// maar een eenmalig gedownload databestand dat je zelf van
// https://www.rivm.nl/nederlands-voedingsstoffenbestand hebt gehaald (met
// hun voorwaarden geaccepteerd) en in server/utils/NEVO/ hebt gezet. Dat
// bestand staat expres NIET in git (zie .gitignore) vanwege die voorwaarden
// -- moet dus apart op elke omgeving (dev-machine, Pi) aanwezig zijn. Als
// het ontbreekt, geeft searchNevoFoods() gewoon een lege lijst terug in
// plaats van te crashen.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface NevoFoodMatch {
  id: number;
  naam: string;
  merk: string | null;
  inhoud: string | null;
  afbeeldingUrl: string | null;
  winkelCategorie: string | null;
  kcalPer100g: number;
  eiwitPer100g: number;
  vetPer100g: number;
  koolhydratenPer100g: number;
  bron: "nevo";
}

const CSV_PATH = join(process.cwd(), "server/utils/NEVO/NEVO2025_v9.0.csv");

// Kolomposities (0-indexed) in het NEVO-hoofdbestand -- vastgesteld door de
// header van NEVO2025_v9.0.csv te tellen. Verandert alleen bij een nieuwe
// NEVO-versie met een andere kolomvolgorde.
const COL_NEVO_CODE = 3;
const COL_GROEP = 1;
const COL_NAAM = 4;
const COL_SYNONIEM = 6;
const COL_KCAL = 12;
const COL_PROT = 14;
const COL_FAT = 19;
const COL_CHO = 27;

function parseDelimitedLine(line: string, delimiter = "|"): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

// NEVO gebruikt de Nederlandse notatie (komma als decimaalteken).
function parseDutchNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

interface NevoFoodRow extends NevoFoodMatch {
  // Voor het matchen op de vaak informele naam die iemand intypt (bv.
  // "kalfslever") in plaats van NEVO's formele notatie ("Lever kalfs-
  // rauw") -- alleen intern gebruikt om op te zoeken, niet teruggegeven.
  zoekterm: string;
}

let cache: NevoFoodRow[] | null = null;

function loadNevoData(): NevoFoodRow[] {
  if (cache) return cache;

  if (!existsSync(CSV_PATH)) {
    console.warn(`[nevo] Databestand niet gevonden op ${CSV_PATH} -- NEVO-fallback staat effectief uit.`);
    cache = [];
    return cache;
  }

  const text = readFileSync(CSV_PATH, "utf-8");
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);

  const rows: NevoFoodRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseDelimitedLine(line);
    const kcal = parseDutchNumber(cols[COL_KCAL] ?? "");
    const eiwit = parseDutchNumber(cols[COL_PROT] ?? "");
    const vet = parseDutchNumber(cols[COL_FAT] ?? "");
    const koolhydraten = parseDutchNumber(cols[COL_CHO] ?? "");
    const naam = cols[COL_NAAM]?.trim();
    if (!naam || kcal === null || eiwit === null || vet === null || koolhydraten === null) continue;

    const synoniem = cols[COL_SYNONIEM]?.trim() ?? "";

    rows.push({
      id: Number(cols[COL_NEVO_CODE]) || rows.length,
      naam,
      merk: null,
      inhoud: null,
      afbeeldingUrl: null,
      winkelCategorie: cols[COL_GROEP]?.trim() || null,
      kcalPer100g: kcal,
      eiwitPer100g: eiwit,
      vetPer100g: vet,
      koolhydratenPer100g: koolhydraten,
      bron: "nevo",
      zoekterm: `${naam} ${synoniem}`.toLowerCase()
    });
  }

  cache = rows;
  return cache;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Rangschikt op relevantie, niet zomaar op volgorde in het bestand -- puur
// "bevat de zoekterm" laat bv. "aardappel" (a-a-r-d-APPEL-en, letterlijk
// "aarde-appel") boven echte appel-resultaten uitkomen bij het zoeken op
// "appel", puur omdat er toevallig veel aardappelgerechten in NEVO staan.
// 0 = naam begint ermee, 1 = los woord ergens in de naam/synoniem,
// 2 = zomaar een substring (bv. midden in een samengesteld woord).
function relevantie(row: NevoFoodRow, q: string): number {
  if (row.naam.toLowerCase().startsWith(q)) return 0;
  const wordBoundary = new RegExp(`(^|[^a-zà-ÿ])${escapeRegExp(q)}`, "i");
  if (wordBoundary.test(row.zoekterm)) return 1;
  return 2;
}

export function searchNevoFoods(query: string, limit = 8): NevoFoodMatch[] {
  const data = loadNevoData();
  if (!data.length) return [];

  const q = query.trim().toLowerCase();
  if (!q) return [];

  return data
    .filter((r) => r.zoekterm.includes(q))
    .map((r) => ({ row: r, score: relevantie(r, q) }))
    .sort((a, b) => a.score - b.score || a.row.naam.length - b.row.naam.length)
    .slice(0, limit)
    .map(({ row: { zoekterm, ...match } }) => match);
}
