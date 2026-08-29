import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";

/**
 * User schema definition
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Users collection - stores user data locally
 * Uses email as the unique key
 */
export const usersCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (user) => user.id,
    schema: UserSchema,
  }),
);
