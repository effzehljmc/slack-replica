import { Id } from "@/convex/_generated/dataModel";

export interface User {
  _id: Id<"users">;
  id: string;
  email: string;
  name?: string;
  status?: 'online' | 'offline' | 'away';
  autoAvatarEnabled?: boolean;
  avatarStyle?: string;
  avatarTraits?: string[];
  voiceDescription?: string;
  voiceId?: string;
  voiceModelId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type AuthError = {
  message: string;
  code?: string;
}

export type AuthVariant = "LOGIN" | "REGISTER";