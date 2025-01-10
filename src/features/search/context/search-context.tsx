'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

interface SearchFilters {
  channelId?: Id<"channels">;
  userId?: Id<"users">;
  startDate?: number;
  endDate?: number;
}

interface SearchResult {
  _id: Id<"messages"> | Id<"direct_messages">;
  type: 'channel_message' | 'direct_message';
  content: string;
  createdAt: number;
  author: {
    name: string;
    email: string;
  };
  channel?: {
    name: string;
  };
  recipient?: {
    name: string;
    email: string;
  };
  channelId?: Id<"channels">;
  receiverId?: Id<"users">;
}

interface SearchContextType {
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  searchResults: SearchResult[] | undefined;
  isLoading: boolean;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchFilters({});
    setSearchOpen(false);
  }, []);

  // Fetch search results
  const searchResults = useQuery(
    api.search.searchAllMessages,
    debouncedQuery.length >= 2 || Object.keys(searchFilters).length > 0
      ? {
          query: debouncedQuery,
          ...searchFilters,
          limit: 20,
        }
      : "skip"
  );

  const isLoading = (debouncedQuery.length >= 2 || Object.keys(searchFilters).length > 0) && searchResults === undefined;

  const value = {
    isSearchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    searchFilters,
    setSearchFilters,
    searchResults,
    isLoading,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 