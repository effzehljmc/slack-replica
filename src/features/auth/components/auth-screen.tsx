"use client";

import { LoginForm } from "./LoginForm";
import { useState } from "react";
import type { AuthVariant } from "../types";

export function AuthScreen() {
    const [variant, setVariant] = useState<AuthVariant>("LOGIN");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-white bg-pattern">
            <div className="w-full max-w-md p-10 space-y-8 bg-white/80 backdrop-blur-sm text-gray-900 rounded-3xl shadow-2xl border border-white/20">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">
                        {variant === "LOGIN" ? "Welcome back" : "Create account"}
                    </h2>
                    <p className="mt-2 text-base text-gray-600 font-serif">
                        {variant === "LOGIN" ? "Sign in to your account" : "Start your journey with us"}
                    </p>
                </div>

                <LoginForm variant={variant} />

                <div className="text-center">
                    <button 
                        onClick={() => setVariant(variant === "LOGIN" ? "REGISTER" : "LOGIN")}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 text-base font-sans"
                    >
                        {variant === "LOGIN" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}