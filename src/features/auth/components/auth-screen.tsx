"use client";

import { LoginForm } from "./LoginForm";
import { useState } from "react";
import type { AuthVariant } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthScreen() {
    const [variant, setVariant] = useState<AuthVariant>("LOGIN");

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">
                        {variant === "LOGIN" ? "Welcome back" : "Create account"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {variant === "LOGIN" ? "Sign in to your account" : "Enter your details to get started"}
                    </p>
                </CardHeader>
                <CardContent>
                    <LoginForm variant={variant} />
                    <div className="text-sm text-center mt-4">
                        <button 
                            onClick={() => setVariant(variant === "LOGIN" ? "REGISTER" : "LOGIN")}
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            {variant === "LOGIN" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}