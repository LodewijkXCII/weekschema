import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { user, session, account, verification } from "../db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification }
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    // No mail provider configured yet -- fine for a 2-person household app.
    requireEmailVerification: false
  },
  user: {
    additionalFields: {
      householdId: {
        type: "string",
        required: false,
        input: false // set server-side only, see /api/household/join and /api/household/create
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30 // 30 days -- this is a private household app
  }
});
