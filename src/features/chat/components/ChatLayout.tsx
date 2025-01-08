'use client';

import { useState } from "react";
import { Message } from "../types";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex h-screen bg-white">
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
} 