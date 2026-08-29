import { useLiveQuery, eq } from "@tanstack/react-db";
import { useCallback } from "react";
import { useCollections } from "./useCollections";
import type { User } from "../collections";

/**
 * Hook to access and manage authentication state
 *
 * Uses TanStack DB's useLiveQuery to reactively track auth state changes
 * across the entire application
 */
export function useAuth() {
  const { usersCollection, authSessionCollection } = useCollections();

  // Reactive query that automatically updates when auth state changes
  const { data: sessions } = useLiveQuery((q) =>
    q.from({ session: authSessionCollection }).select(({ session }) => ({
      ...session,
    })),
  );

  const session = sessions[0];

  // Get current user if authenticated
  const { data: users } = useLiveQuery((q) =>
    q
      .from({ user: usersCollection })
      .where(({ user }) => eq(user.id, session?.userId))
      .select(({ user }) => ({ ...user })),
  );

  const currentUser = users[0];

  /**
   * Login function - updates auth session and optionally stores user
   */
  const login = useCallback(
    (user: User, token: string, expiresAt: Date) => {
      // Store user in users collection
      usersCollection.update(user.id, (draft) => {
        Object.assign(draft, user);
      });

      // Update auth session
      authSessionCollection.update("current", (draft) => {
        draft.userId = user.id;
        draft.token = token;
        draft.expiresAt = expiresAt;
        draft.isAuthenticated = true;
      });
    },
    [usersCollection, authSessionCollection],
  );

  /**
   * Logout function - clears auth session
   */
  const logout = useCallback(() => {
    authSessionCollection.update("current", (draft) => {
      draft.userId = null;
      draft.token = null;
      draft.expiresAt = null;
      draft.isAuthenticated = false;
    });
  }, [authSessionCollection]);

  /**
   * Update current user data
   */
  const updateUser = useCallback(
    (updates: Partial<Omit<User, "id">>) => {
      if (!currentUser) return;

      usersCollection.update(currentUser.id, (draft) => {
        Object.assign(draft, updates, { updatedAt: new Date() });
      });
    },
    [currentUser, usersCollection],
  );

  return {
    session,
    currentUser,
    isAuthenticated: session?.isAuthenticated ?? false,
    isLoading: !session,
    login,
    logout,
    updateUser,
  };
}
