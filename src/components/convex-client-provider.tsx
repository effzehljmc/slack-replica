'use client';

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY } from "@/config";

const convex = new ConvexReactClient(NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ClerkProvider publishableKey={NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
} 