import { useAuth } from './use-auth';

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();

  const isLoading = user === undefined;

  return {
    data: user,
    isLoading,
    isAuthenticated
  };
} 