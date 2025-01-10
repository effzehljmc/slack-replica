'use client'

import { Plus, Hash, Users, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface WelcomeScreenProps {
  onJoinGeneral: () => void;
  onCreateChannel: () => void;
  onSelectUser: (userId: string) => void;
  onlineUsers: Array<{ id: string; name: string; }>;
}

export function WelcomeScreen({ onJoinGeneral, onCreateChannel, onSelectUser, onlineUsers }: WelcomeScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 pt-20 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Welcome to ChatGenius! 👋</h1>
            <p className="text-lg text-muted-foreground">
              Get started by joining channels or create your own to collaborate with your team
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Hash className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Join #general</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Connect with your team in the main channel for company-wide discussions
                </p>
                <Button className="w-full mt-2" onClick={onJoinGeneral}>
                  Join Channel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Create a Channel</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Start a new channel for your project, team, or topic of interest
                </p>
                <Button variant="outline" className="w-full mt-2" onClick={onCreateChannel}>
                  Create Channel
                  <Plus className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="pt-8">
            <Card className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Direct Messages</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Start a private conversation with any team member
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {onlineUsers.map((user) => (
                    <Button 
                      key={user.id} 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => onSelectUser(user.id)}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {user.name}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 