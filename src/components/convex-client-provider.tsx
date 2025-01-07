'use client';

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { NEXT_PUBLIC_CONVEX_URL } from "@/config";

const convex = new ConvexReactClient(NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
} 