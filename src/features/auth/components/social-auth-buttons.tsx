'use client';

import { Button } from "@/components/Button";
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
    <div className="flex flex-col gap-4">
      <Button 
        onClick={() => socialAction('google')}
        className="flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        <FcGoogle size={20} />
        {isLoading ? 'Loading...' : 'Continue with Google'}
      </Button>
      <Button 
        onClick={() => socialAction('github')}
        className="flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        <FaGithub size={20} />
        {isLoading ? 'Loading...' : 'Continue with Github'}
      </Button>
    </div>
  );
} 