'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  children?: React.ReactNode;
  className?: string;
}

export function Avatar({ children, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      {children}
    </div>
  );
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) {
    return null;
  }

  return (
    <div className={cn('relative h-full w-full rounded-full overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt || ''}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('h-full w-full rounded-full bg-red-500 text-white flex items-center justify-center', className)}>
      {children}
    </div>
  );
} 