'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearch } from '../context/search-context';
import { cn } from '@/lib/utils';

export function DateRangePicker() {
  const { searchFilters, setSearchFilters } = useSearch();
  const [isOpen, setIsOpen] = useState(false);

  const startDate = searchFilters.startDate ? new Date(searchFilters.startDate) : undefined;
  const endDate = searchFilters.endDate ? new Date(searchFilters.endDate) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!startDate) {
      setSearchFilters({
        ...searchFilters,
        startDate: date.getTime(),
      });
    } else if (!endDate && date > startDate) {
      setSearchFilters({
        ...searchFilters,
        endDate: date.getTime(),
      });
      setIsOpen(false);
    } else {
      setSearchFilters({
        ...searchFilters,
        startDate: date.getTime(),
        endDate: undefined,
      });
    }
  };

  const clearDateRange = () => {
    setSearchFilters({
      ...searchFilters,
      startDate: undefined,
      endDate: undefined,
    });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!startDate) return 'Date';
    if (!endDate) return `From ${startDate.toLocaleDateString()}`;
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={startDate ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            "flex items-center gap-1",
            startDate && "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Date Range</h4>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={clearDateRange}
              >
                Clear Range
              </Button>
            )}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={startDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
} 