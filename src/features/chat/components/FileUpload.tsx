'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

interface FileUploadProps {
  onUploadComplete?: (attachmentId: Id<"attachments">) => void;
  messageId?: Id<"messages"> | Id<"direct_messages">;
  channelId?: Id<"channels">;
  className?: string;
  compact?: boolean;
}

export function FileUpload({ onUploadComplete, messageId, channelId, className, compact = false }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveAttachment = useMutation(api.files.saveAttachment);
  const { data: currentUser } = useCurrentUser();
  
  const handleUpload = async (file: File) => {
    try {
      if (!currentUser?._id) {
        throw new Error('Please sign in to upload files');
      }

      setIsUploading(true);
      console.log("Starting file upload for:", file.name, "type:", file.type);
      
      // Determine file type
      const fileType = file.type || 'application/octet-stream';
      console.log("Using file type:", fileType);
      
      // Step 1: Get upload URL
      console.log("Generating upload URL...");
      const uploadUrl = await generateUploadUrl({
        fileSize: file.size,
        fileType,
        userId: currentUser._id,
      });
      console.log("Got upload URL:", uploadUrl);
      
      // Step 2: Upload file to storage
      console.log("Uploading file to storage...");
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": fileType,
        },
      });

      const responseText = await uploadResponse.text();
      console.log("Upload response:", responseText);

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${responseText}`);
      }

      // Step 3: Extract storage ID from response
      let storageId: string;
      try {
        const responseData = JSON.parse(responseText);
        storageId = responseData.storageId;
        console.log("Extracted storage ID from response:", storageId);

        if (!storageId) {
          throw new Error('No storage ID in response');
        }
      } catch (error) {
        console.error('Failed to parse upload response:', error);
        throw new Error('Failed to get storage ID from upload response');
      }

      console.log("File uploaded successfully to storage");
      
      // Step 4: Save attachment metadata
      const metadata = {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        storageId,
        messageId,
        channelId,
        userId: currentUser._id,
      };
      console.log("Saving attachment metadata...", metadata);
      
      const attachment = await saveAttachment(metadata);
      console.log("Attachment saved:", attachment);
      
      // Step 5: Notify parent component
      onUploadComplete?.(attachment);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className={cn("relative inline-flex items-center z-10", className)}>
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        className={cn(
          "text-gray-500 dark:text-gray-400",
          "hover:text-gray-900 dark:hover:text-white",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        disabled={isUploading}
      >
        {isUploading ? (
          <div className="animate-spin">⏳</div>
        ) : (
          <>
            <Paperclip className="h-4 w-4" />
            {!compact && <span className="ml-2">Add File</span>}
          </>
        )}
      </Button>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        id="file-upload"
        disabled={isUploading}
        aria-label="Upload file"
      />
    </div>
  );
} 