'use client';

import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import type { AuthVariant } from "../types";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      if (variant === "LOGIN") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {variant === "REGISTER" && (
          <div className="space-y-2">
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              autoComplete="name"
              disabled={isLoading}
              required
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={variant === "LOGIN" ? "current-password" : "new-password"}
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading 
          ? "Please wait..." 
          : variant === "LOGIN" 
            ? "Sign in" 
            : "Create account"
        }
      </Button>
    </form>
  );
} 