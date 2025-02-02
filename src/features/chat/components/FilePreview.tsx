'use client';

import { FileText } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Image from 'next/image';

interface FilePreviewProps {
  attachmentId: Id<"attachments">;
}

export function FilePreview({ attachmentId }: FilePreviewProps) {
  const attachment = useQuery(api.files.getAttachment, { id: attachmentId });
  
  if (!attachment) {
    return null;
  }
  
  const { fileName, fileType, storageId } = attachment;
  const isImage = fileType.startsWith('image/');
  const fileUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL}/storage/${storageId}`;
  
  return (
    <div className="rounded-lg border p-2 max-w-xs">
      {isImage ? (
        <div className="relative w-full h-48">
          <Image 
            src={fileUrl} 
            alt={fileName} 
            fill
            className="object-contain rounded" 
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline truncate"
          >
            {fileName}
          </a>
        </div>
      )}
    </div>
  );
} 