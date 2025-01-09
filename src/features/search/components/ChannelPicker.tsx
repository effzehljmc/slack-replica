'use client';

import { useState } from 'react';
import { Hash } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearch } from '../context/search-context';
import { cn } from '@/lib/utils';

export function ChannelPicker() {
  const { searchFilters, setSearchFilters } = useSearch();
  const [isOpen, setIsOpen] = useState(false);

  // Get all channels
  const channels = useQuery(api.channels.listChannels);

  const selectedChannel = channels?.find(channel => channel._id === searchFilters.channelId);

  const handleChannelSelect = (channelId: string) => {
    setSearchFilters({
      ...searchFilters,
      channelId: channelId as any, // TODO: Fix type
    });
    setIsOpen(false);
  };

  const clearChannel = () => {
    setSearchFilters({
      ...searchFilters,
      channelId: undefined,
    });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedChannel ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            "flex items-center gap-1",
            selectedChannel && "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
          )}
        >
          <Hash className="h-4 w-4" />
          <span className="hidden sm:inline">
            {selectedChannel ? selectedChannel.name : 'Channel'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Filter by Channel</h4>
            {selectedChannel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={clearChannel}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
        <div className="py-2">
          {channels?.map((channel) => (
            <button
              key={channel._id}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm gap-2",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                channel._id === searchFilters.channelId && "bg-gray-100 dark:bg-gray-800"
              )}
              onClick={() => handleChannelSelect(channel._id)}
            >
              <Hash className="h-4 w-4" />
              <span>{channel.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 