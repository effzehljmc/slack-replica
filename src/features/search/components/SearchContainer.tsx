'use client';

import { useEffect, useRef } from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { useSearch } from '../context/search-context';

export function SearchContainer() {
  const { isSearchOpen, setSearchOpen } = useSearch();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, setSearchOpen]);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <SearchBar />
      <SearchResults />
    </div>
  );
} 