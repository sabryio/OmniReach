/**
 * TanStack DB - Database Layer
 *
 * This module provides a type-safe, reactive local database using TanStack DB.
 *
 * Architecture:
 * - collections/: Schema definitions and collection instances
 * - hooks/: React hooks for accessing and manipulating data
 *
 * Best Practices:
 * 1. Always define schemas with Zod for type safety
 * 2. Use useLiveQuery for reactive data that updates automatically
 * 3. Keep collections focused (single responsibility)
 * 4. Export everything through index files for clean imports
 * 5. Use hooks to encapsulate business logic
 *
 * Example Usage:
 * ```tsx
 * import { useAuth } from '@/db/hooks'
 *
 * function MyComponent() {
 *   const { currentUser, login, logout } = useAuth()
 *   // Component automatically re-renders when auth state changes
 * }
 * ```
 */

export * from "./collections";
export * from "./hooks";
