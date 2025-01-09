'use client';

import { useSearch } from '../context/search-context';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';

function formatDate(date: Date | number | string) {
  if (!date) return 'No date';
  try {
    const d = new Date(date);
    if (!isValid(d)) return 'No date';
    return format(d, 'MMM d, yyyy');
  } catch (error) {
    return 'No date';
  }
}

function formatTime(date: Date | number | string) {
  if (!date) return 'No time';
  try {
    const d = new Date(date);
    if (!isValid(d)) return 'No time';
    return format(d, 'h:mm a');
  } catch (error) {
    return 'No time';
  }
}

function highlightText(text: string, query: string) {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-yellow-200 dark:bg-yellow-900">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function SearchResults() {
  const {
    isSearchOpen,
    searchQuery,
    searchResults,
    isLoading,
    clearSearch,
    searchFilters,
  } = useSearch();

  if (!isSearchOpen) return null;

  const hasFilters = Object.keys(searchFilters).length > 0;
  const showResults = searchQuery.length >= 2 || hasFilters;

  if (!showResults) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-800">
        <div className="p-4 text-center text-gray-500">
          {hasFilters ? 'Type to search in filtered messages' : 'Type at least 2 characters to search'}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-800 max-h-[60vh] overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : searchResults?.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No results found for "{searchQuery}"
          {hasFilters && ' with current filters'}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {searchResults?.map((result) => (
            <div
              key={result._id}
              className={cn(
                "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
                "transition-colors duration-200"
              )}
              onClick={() => {
                if (result.type === 'channel_message') {
                  window.dispatchEvent(new CustomEvent('navigate-to-message', {
                    detail: {
                      type: 'channel',
                      channelId: result.channelId,
                      messageId: result._id,
                    },
                  }));
                } else {
                  window.dispatchEvent(new CustomEvent('navigate-to-message', {
                    detail: {
                      type: 'direct',
                      userId: result.receiverId,
                      messageId: result._id,
                    },
                  }));
                }
                clearSearch();
              }}
            >
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                {result.type === 'channel_message' ? (
                  <>
                    <span>in #{result.channel.name}</span>
                    <span>•</span>
                  </>
                ) : (
                  <>
                    <span>Direct Message with {result.recipient.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {result.createdAt ? `${formatDate(result.createdAt)} at ${formatTime(result.createdAt)}` : 'No date'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {result.author.name[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-medium">{result.author.name || result.author.email}</div>
                  <div className="text-gray-700 dark:text-gray-300">
                    {highlightText(result.content, searchQuery)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 