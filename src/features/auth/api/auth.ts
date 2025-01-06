import { LoginFormData, LoginResponse } from '../types';

export async function login(credentials: LoginFormData): Promise<LoginResponse> {
  // TODO: Implement actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'dummy_token',
        user: {
          id: '1',
          email: credentials.email,
          name: 'Test User'
        },
      });
    }, 1000);
  });
} 