"use client";

import { LoginForm } from "./LoginForm";
import { SocialAuthButtons } from "./social-auth-buttons";
import { useState } from "react";
import type { AuthVariant } from "../types";

export function AuthScreen() {
    const [variant, setVariant] = useState<AuthVariant>("LOGIN");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {variant === "LOGIN" ? "Welcome back" : "Create an account"}
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {variant === "LOGIN" ? "Sign in to your account" : "Sign up for a new account"}
                    </p>
                </div>
                <SocialAuthButtons />
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                            Or continue with
                        </span>
                    </div>
                </div>
                <LoginForm variant={variant} />
                <div className="text-center text-sm">
                    <button 
                        onClick={() => setVariant(variant === "LOGIN" ? "REGISTER" : "LOGIN")}
                        className="text-blue-500 hover:underline"
                    >
                        {variant === "LOGIN" 
                            ? "New user? Create an account" 
                            : "Already have an account? Sign in"}
                    </button>
                </div>
                <p className="text-center text-sm text-gray-500">
                    By continuing, you agree to our{' '}
                    <a href="#" className="underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="underline">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}