"use client";

import { LoginForm } from "./LoginForm";
import { SocialAuthButtons } from "./social-auth-buttons";
import { useState } from "react";
import type { AuthVariant } from "../types";

export function AuthScreen() {
    const [variant, setVariant] = useState<AuthVariant>("LOGIN");

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#4A2B5C]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Login to continue
                    </h2>
                    <p className="mt-2 text-gray-600 text-sm">
                        Use your email or another service to continue
                    </p>
                </div>

                <LoginForm variant={variant} />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">
                            Or continue with
                        </span>
                    </div>
                </div>

                <SocialAuthButtons />

                <div className="text-center text-sm">
                    <button 
                        onClick={() => setVariant(variant === "LOGIN" ? "REGISTER" : "LOGIN")}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        Don't have an account?
                    </button>
                </div>
            </div>
        </div>
    );
}