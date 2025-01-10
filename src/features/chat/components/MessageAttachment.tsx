'use client';

import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Image from 'next/image';

interface MessageAttachmentProps {
  fileName: string;
  fileType: string;
  storageId: string;
  fileSize: number;
}

export function MessageAttachment({ fileName, fileType, storageId, fileSize }: MessageAttachmentProps) {
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isImage = fileType.startsWith('image/') && !imageError;
  const downloadUrl = useQuery(api.files.generateDownloadUrl, { storageId });
  
  console.log('Component initialized with:', { fileName, fileType, storageId, fileSize });
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Image failed to load:', downloadUrl);
  };

  const handleDownload = async () => {
    if (!downloadUrl) {
      console.error('No download URL available');
      return;
    }

    console.log('Starting download process for:', fileName);
    console.log('Using storage ID:', storageId);
    console.log('Full download URL:', downloadUrl);
    
    setIsDownloading(true);
    try {
      console.log('Initiating fetch request...');
      const response = await fetch(downloadUrl);
      console.log('Fetch response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText || 'No status text provided',
          headers: Object.fromEntries(response.headers.entries()),
        };
        console.error('Download failed with details:', errorDetails);
        
        // Try to read the response body for more error details
        try {
          const errorBody = await response.text();
          console.error('Error response body:', errorBody);
        } catch (bodyError) {
          console.error('Could not read error response body:', bodyError);
        }
        
        throw new Error(`Download failed: Status ${response.status} - ${response.statusText || 'No error details available'}`);
      }
      
      console.log('Response OK, creating blob...');
      const blob = await response.blob();
      console.log('Blob created:', {
        size: blob.size,
        type: blob.type
      });
      
      const blobUrl = window.URL.createObjectURL(blob);
      console.log('Blob URL created:', blobUrl);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      console.log('Download anchor created and appended');
      
      a.click();
      console.log('Download triggered');
      
      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Download process failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 max-w-sm space-y-2">
      {isImage ? (
        <div className="space-y-2">
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
            {downloadUrl && (
              <Image 
                src={downloadUrl} 
                alt={fileName} 
                fill
                className="object-contain" 
                loading="lazy"
                onError={handleImageError}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="truncate flex-1">{fileName}</span>
            <div className="flex items-center gap-2">
              <span>{formatFileSize(fileSize)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="flex-shrink-0"
                disabled={!downloadUrl || isDownloading}
              >
                {isDownloading ? (
                  <div className="animate-spin">⏳</div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{fileName}</div>
            <div className="text-xs text-gray-500">{formatFileSize(fileSize)}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="flex-shrink-0"
            disabled={!downloadUrl || isDownloading}
          >
            {isDownloading ? (
              <div className="animate-spin">⏳</div>
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 