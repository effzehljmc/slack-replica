import { cn } from "@/lib/utils";

interface UserStatusIndicatorProps {
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

export function UserStatusIndicator({ status = 'offline', className }: UserStatusIndicatorProps) {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  };
  
  return (
    <div 
      className={cn(
        'w-2 h-2 rounded-full',
        statusColors[status],
        className
      )} 
      title={`Status: ${status}`}
    />
  );
} 