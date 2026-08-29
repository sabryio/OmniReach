import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";

/**
 * Auth session schema definition
 */
export const AuthSessionSchema = z.object({
  id: z.literal("current"), // Singleton - only one session at a time
  userId: z.string().nullable(),
  token: z.string().nullable(),
  expiresAt: z.date().nullable(),
  isAuthenticated: z.boolean(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

/**
 * Auth session collection - stores current authentication state
 * This is a singleton collection (only one record with id='current')
 */
export const authSessionCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (session) => session.id,
    schema: AuthSessionSchema,
  }),
);

// Initialize with default unauthenticated state
authSessionCollection.insert({
  id: "current",
  userId: null,
  token: null,
  expiresAt: null,
  isAuthenticated: false,
});
