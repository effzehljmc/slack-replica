'use client';

import { useEffect, useRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useSearch } from '../context/search-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DateRangePicker } from './DateRangePicker';
import { UserPicker } from './UserPicker';
import { ChannelPicker } from './ChannelPicker';

export function SearchBar() {
  const {
    isSearchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    searchFilters,
    clearSearch,
  } = useSearch();

  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Control + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
      }
      // Escape to close search
      if (e.key === 'Escape' && isSearchOpen) {
        e.preventDefault();
        clearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen, clearSearch]);

  const hasFilters = searchFilters.channelId || searchFilters.userId || searchFilters.startDate;

  return (
    <div className="relative max-w-md w-full">
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-3 h-4 w-4 text-gray-500" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search messages... (⌘K)"
          className={cn(
            "w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md",
            "focus:ring-2 focus:ring-blue-500 focus:outline-none",
            "placeholder-gray-500 dark:placeholder-gray-400"
          )}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
        />
        {(searchQuery || hasFilters) && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Filters */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-800">
          <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
            <DateRangePicker />
            <UserPicker />
            <ChannelPicker />
          </div>
        </div>
      )}
    </div>
  );
} 