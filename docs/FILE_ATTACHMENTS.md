# File Attachments in ChatGenius

## Overview
File attachments in ChatGenius are handled through a two-step process:
1. File upload to Convex storage
2. Message creation with attachment reference

## Key Components

### Frontend
- `FileUpload.tsx`: Handles file upload UI and storage
- `MessageAttachment.tsx`: Renders file previews and download buttons
- `MessageItem.tsx`: Displays messages with attachments
- `layout.tsx`: Manages attachment state and message sending

### Backend
- `files.ts`: Handles file storage and retrieval
- `messages.ts` & `direct_messages.ts`: Message creation with attachment references

## Critical Points

### Message Sending
When sending messages with attachments, ALWAYS ensure:
1. The `attachmentId` is passed to both `sendChannelMessage` and `sendDirectMessage` mutations
2. The `attachmentId` is included in the message data structure
3. The attachment state is cleared after message sending

### Message Fetching
When fetching messages, ALWAYS ensure:
1. Attachments are included in the query response
2. The attachment data is properly mapped to the message structure
3. Both channel messages and direct messages handle attachments consistently

### Code Example
```typescript
// Correct way to send a message with attachment
const handleMessageSubmit = async (content: string) => {
  if (!user) return;

  try {
    if (chatMode === 'channel' && selectedChannel) {
      await sendChannelMessage({
        content,
        authorId: user._id,
        channelId: selectedChannel._id,
        isAvatarMessage: false,
        attachmentId: attachmentId || undefined, // Don't forget this!
      });
    } else if (chatMode === 'direct' && selectedUser) {
      await sendDirectMessage({
        content,
        senderId: user._id,
        receiverId: selectedUser._id,
        isAvatarMessage: false,
        attachmentId: attachmentId || undefined, // Don't forget this!
      });
    }

    setMessageInput('');
    setAttachmentId(null); // Clear attachment state after sending
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

## Common Issues
1. **Missing Attachment ID**: Ensure `attachmentId` is passed in message mutations
2. **Attachment State**: Clear attachment state after message sending
3. **Query Inclusion**: Include attachments in message queries
4. **Type Safety**: Use proper typing for attachment data

## Testing
Before making changes to file attachment functionality:
1. Test file upload in both channels and direct messages
2. Verify file preview and download in both contexts
3. Check attachment state management
4. Ensure proper cleanup of attachment references 