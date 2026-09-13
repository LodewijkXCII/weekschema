// Application schema (Drizzle ORM, Postgres).
//
// The better-auth core tables (user, session, account, verification) are NOT
// hand-written here -- run `npm run auth:generate` to have better-auth's own
// CLI generate them into ./server/db/auth-schema.ts, based on the config in
// server/utils/auth.ts. That keeps them correct as better-auth evolves.
// This file only contains our own application tables, which reference
// `user.id` from that generated file.

import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  date,
  timestamp,
  unique
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

// A household is the shared unit that owns recipes, ingredients and week
// plans -- e.g. two partners planning meals together.
export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  naam: text("naam").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const householdMembers = pgTable(
  "household_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (t) => ({
    uniqMembership: unique().on(t.householdId, t.userId)
  })
);

// Ingredients hold macros per 100g so any recipe amount can be scaled.
export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  naam: text("naam").notNull(),
  kcalPer100g: real("kcal_per_100g").notNull(),
  eiwitPer100g: real("eiwit_per_100g").notNull(),
  vetPer100g: real("vet_per_100g").notNull(),
  koolhydratenPer100g: real("koolhydraten_per_100g").notNull(),
  // Ruwe winkel-categorie (bv. "Zuivel, eieren", "Groente, aardappelen")
  // -- automatisch gevuld vanuit AH's mainCategory bij een AH-zoekresultaat,
  // anders handmatig te zetten. Gebruikt om de boodschappenlijst te
  // groeperen.
  winkelCategorie: text("winkel_categorie"),
  // Basisvoorraad-ingrediënten (zout, olie, bloem...) staan standaard
  // uitgevinkt op de boodschappenlijst -- je hebt ze meestal al in huis.
  basisvoorraad: boolean("basisvoorraad").notNull().default(false),
  // Vrije allergie-/dieet-tags (bv. "gluten", "lactose", "noten"), puur
  // informatief -- getoond als badges bij een recept.
  allergenen: text("allergenen").array(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Een recept hoort bij precies 1 categorie, die overeenkomt met een
// eetmoment (zie MEAL_MOMENTS). Dit voorkomt dat het weekbord een
// dinerrecept voorstelt voor het ontbijt-vakje, en andersom.
export const recipeCategorieen = ["ontbijt", "lunch", "diner", "tussendoor"] as const;
export type RecipeCategorie = (typeof recipeCategorieen)[number];

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  naam: text("naam").notNull(),
  categorie: text("categorie").$type<RecipeCategorie>().notNull().default("diner"),
  afbeeldingUrl: text("afbeelding_url"),
  bereiding: text("bereiding"),
  porties: integer("porties").notNull().default(1),
  favoriet: boolean("favoriet").notNull().default(false),
  tags: text("tags").array(),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "restrict" }),
  hoeveelheidGram: real("hoeveelheid_gram").notNull()
});

// Duimpje omhoog/omlaag per gebruiker per recept -- lichtgewicht feedback,
// geaggregeerd getoond op de receptkaart.
export const recipeReactions = pgTable(
  "recipe_reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // 1 = duim omhoog, -1 = duim omlaag
    waarde: integer("waarde").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (t) => ({
    uniqReaction: unique().on(t.recipeId, t.userId)
  })
);

// Een huishouden kan meerdere doelprofielen hebben (bv. "Ouders" en
// "Kinderen") met elk hun eigen dagelijkse macro-plafonds. Er is altijd
// minstens 1 profiel; het weekbord laat kiezen welk profiel actief is.
export const dailyTargets = pgTable("daily_targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  naam: text("naam").notNull().default("Huishouden"),
  maxKcal: real("max_kcal").notNull().default(2000),
  maxEiwit: real("max_eiwit").notNull().default(120),
  maxVet: real("max_vet").notNull().default(70),
  maxKoolhydraten: real("max_koolhydraten").notNull().default(200)
});

export const weekPlans = pgTable(
  "week_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    // Always the Monday of that week (ISO date, no time component).
    weekStart: date("week_start").notNull()
  },
  (t) => ({
    uniqWeek: unique().on(t.householdId, t.weekStart)
  })
);

// De 5 vaste eetmomenten per dag, in vaste volgorde.
export const MEAL_MOMENTS = [
  { key: "ontbijt", label: "Ontbijt" },
  { key: "tussendoor_1", label: "Tussendoor" },
  { key: "lunch", label: "Lunch" },
  { key: "tussendoor_2", label: "Tussendoor" },
  { key: "diner", label: "Diner" }
] as const;

export type MealMomentKey = (typeof MEAL_MOMENTS)[number]["key"];

export const weekDagen = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag"
] as const;

export type WeekDag = (typeof weekDagen)[number];

export const mealSlots = pgTable(
  "meal_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weekPlanId: uuid("week_plan_id")
      .notNull()
      .references(() => weekPlans.id, { onDelete: "cascade" }),
    dag: text("dag").$type<WeekDag>().notNull(),
    mealMoment: text("meal_moment").$type<MealMomentKey>().notNull(),
    recipeId: uuid("recipe_id").references(() => recipes.id, {
      onDelete: "set null"
    }),
    // Kort briefje bij dit vakje (bv. "extra pittig voor mij").
    notitie: text("notitie"),
    // Wie kookt dit -- verwijst naar een user, niet verplicht.
    kokUserId: text("kok_user_id").references(() => user.id, { onDelete: "set null" })
  },
  (t) => ({
    uniqSlot: unique().on(t.weekPlanId, t.dag, t.mealMoment)
  })
);

// --- relations (used for nested selects with db.query.*) -----------------

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  reactions: many(recipeReactions)
}));

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id]
    }),
    ingredient: one(ingredients, {
      fields: [recipeIngredients.ingredientId],
      references: [ingredients.id]
    })
  })
);

export const recipeReactionsRelations = relations(recipeReactions, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeReactions.recipeId],
    references: [recipes.id]
  })
}));

export const weekPlansRelations = relations(weekPlans, ({ many }) => ({
  slots: many(mealSlots)
}));

export const mealSlotsRelations = relations(mealSlots, ({ one }) => ({
  weekPlan: one(weekPlans, {
    fields: [mealSlots.weekPlanId],
    references: [weekPlans.id]
  }),
  recipe: one(recipes, {
    fields: [mealSlots.recipeId],
    references: [recipes.id]
  })
}));
