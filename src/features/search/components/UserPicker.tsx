'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearch } from '../context/search-context';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { cn } from '@/lib/utils';
import { UserStatusIndicator } from '@/features/chat/components/UserStatusIndicator';
import { Id } from '@/convex/_generated/dataModel';

export function UserPicker() {
  const { searchFilters, setSearchFilters } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();

  // Get all users except current user
  const users = useQuery(
    api.users.listUsers,
    currentUser?._id ? { currentUserId: currentUser._id } : "skip"
  );

  const selectedUser = users?.find(user => user._id === searchFilters.userId);

  const handleUserSelect = (userId: Id<"users">) => {
    setSearchFilters({
      ...searchFilters,
      userId,
    });
    setIsOpen(false);
  };

  const clearUser = () => {
    setSearchFilters({
      ...searchFilters,
      userId: undefined,
    });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedUser ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            "flex items-center gap-1",
            selectedUser && "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
          )}
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">
            {selectedUser ? selectedUser.name || selectedUser.email : 'From'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Filter by User</h4>
            {selectedUser && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={clearUser}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
        <div className="py-2">
          {users?.map((user) => (
            <button
              key={user._id}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm gap-2",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                user._id === searchFilters.userId && "bg-gray-100 dark:bg-gray-800"
              )}
              onClick={() => handleUserSelect(user._id)}
            >
              <UserStatusIndicator status={user.status} />
              <span>{user.name || user.email}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 