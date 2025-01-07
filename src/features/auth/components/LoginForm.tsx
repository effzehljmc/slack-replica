'use client';

import { Button } from "@/components/Button";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import type { AuthVariant } from "../types";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  variant: AuthVariant;
}

export function LoginForm({ variant }: LoginFormProps) {
  const router = useRouter();
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
      console.log('Attempting', variant, 'with:', { email, password, name });
      if (variant === "LOGIN") {
        await signIn(email, password);
        console.log('Login successful');
      } else {
        await signUp(email, password, name);
        console.log('Signup successful');
      }
      router.push('/app');
    } catch (err) {
      console.error('Auth error:', err);
      setError(variant === "LOGIN" ? 'Failed to login.' : 'Failed to register.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
              <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
            </svg>
          </div>
        </div>

        <div className="relative">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#0A0A1B] text-white py-2 rounded-lg hover:bg-[#0A0A1B]/90 focus:outline-none focus:ring-2 focus:ring-[#0A0A1B] focus:ring-offset-2 transition-all"
      >
        {isLoading ? 'Loading...' : 'Continue'}
      </button>
    </form>
  );
} 