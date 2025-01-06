'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export type { AuthContextType };

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // TODO: Implement actual sign in
      console.log('Sign in:', { email, password });
    } catch (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      // TODO: Implement actual sign up
      console.log('Sign up:', { email, password, name });
    } catch (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // TODO: Implement actual sign out
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    } catch (error) {
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      token,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext }; 