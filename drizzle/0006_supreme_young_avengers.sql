ALTER TABLE "meal_slots" ADD COLUMN "ingredient_id" uuid;--> statement-breakpoint
ALTER TABLE "meal_slots" ADD COLUMN "ingredient_hoeveelheid" real;--> statement-breakpoint
ALTER TABLE "meal_slots" ADD COLUMN "ingredient_eenheid" text;--> statement-breakpoint
ALTER TABLE "meal_slots" ADD COLUMN "ingredient_hoeveelheid_gram" real;--> statement-breakpoint
ALTER TABLE "meal_slots" ADD CONSTRAINT "meal_slots_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;