'use client';

import { Button } from "@/components/Button";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import type { AuthVariant } from "../types";

interface LoginFormProps {
  variant: AuthVariant;
}

export function LoginForm({ variant }: LoginFormProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (variant === "LOGIN") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (err) {
      setError(variant === "LOGIN" ? 'Failed to login.' : 'Failed to register.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {variant === "REGISTER" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            disabled={isLoading}
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          disabled={isLoading}
          required
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          disabled={isLoading}
          required
        />
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        variant="primary"
      >
        {isLoading 
          ? (variant === "LOGIN" ? 'Signing in...' : 'Signing up...') 
          : (variant === "LOGIN" ? 'Sign in' : 'Sign up')}
      </Button>
    </form>
  );
} 