import { usersCollection, authSessionCollection } from "../collections";

/**
 * Hook that provides direct access to all collection instances
 *
 * Use this when you need to work with the raw collections
 * for more complex queries or operations
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { usersCollection, authSessionCollection } = useCollections()
 *
 *   // Use collections directly with useLiveQuery
 *   const { data: users } = useLiveQuery((q) =>
 *     q.from({ user: usersCollection }).select(({ user }) => ({ ...user }))
 *   )
 * }
 * ```
 */
export function useCollections() {
  return {
    usersCollection,
    authSessionCollection,
  };
}
