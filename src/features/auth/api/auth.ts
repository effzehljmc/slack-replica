import { LoginFormData, LoginResponse } from '../types';
import { Id } from '@/convex/_generated/dataModel';

export async function login(credentials: LoginFormData): Promise<LoginResponse> {
  // TODO: Implement actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'dummy_token',
        user: {
          _id: '1' as Id<"users">,
          id: '1',
          email: credentials.email,
          name: 'Test User'
        },
      });
    }, 1000);
  });
} 