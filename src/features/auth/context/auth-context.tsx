'use client';

import { createContext, useCallback, useState } from 'react';
import type { User, AuthState } from '../types';
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

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

  const signInAction = useAction(api.auth.signIn);
  const signUpAction = useAction(api.auth.signUp);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const userData = await signInAction({ email, password });
      setUser({
        _id: userData._id,
        id: userData._id,
        email: userData.email,
        name: userData.name,
      });
      setIsAuthenticated(true);
      setToken(`email:${email}`);
    } catch (error) {
      throw error;
    }
  }, [signInAction]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const userData = await signUpAction({ email, password, name });
      setUser({
        _id: userData._id,
        id: userData._id,
        email: userData.email,
        name: userData.name,
      });
      setIsAuthenticated(true);
      setToken(`email:${email}`);
    } catch (error) {
      throw error;
    }
  }, [signUpAction]);

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