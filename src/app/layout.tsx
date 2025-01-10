import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from '@/features/auth/context/auth-context';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Slack Replica",
  description: "A modern real-time chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexClientProvider>
          <AuthProvider>
            <ThemeProvider
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
