CREATE TABLE "recipe_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"waarde" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_reactions_recipe_id_user_id_unique" UNIQUE("recipe_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "daily_targets" DROP CONSTRAINT "daily_targets_household_id_unique";--> statement-breakpoint
ALTER TABLE "daily_targets" ADD COLUMN "naam" text DEFAULT 'Huishouden' NOT NULL;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "winkel_categorie" text;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "basisvoorraad" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "allergenen" text[];--> statement-breakpoint
ALTER TABLE "meal_slots" ADD COLUMN "notitie" text;--> statement-breakpoint
ALTER TABLE "meal_slots" ADD COLUMN "kok_user_id" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "favoriet" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "recipe_reactions" ADD CONSTRAINT "recipe_reactions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_reactions" ADD CONSTRAINT "recipe_reactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_slots" ADD CONSTRAINT "meal_slots_kok_user_id_user_id_fk" FOREIGN KEY ("kok_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;