'use client';

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";

export function SocialAuthButtons() {
  const [isLoading, setIsLoading] = useState(false);

  const socialAction = async (action: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement social sign in
      console.log("Social action:", action);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => socialAction('google')}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
      >
        <FcGoogle size={20} />
        <span className="text-gray-600">Continue with Google</span>
      </button>

      <button
        onClick={() => socialAction('github')}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
      >
        <FaGithub size={20} />
        <span className="text-gray-600">Continue with Github</span>
      </button>
    </div>
  );
} 