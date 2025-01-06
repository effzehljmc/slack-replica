export interface User {
  id: string;
  email: string;
  name?: string;
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