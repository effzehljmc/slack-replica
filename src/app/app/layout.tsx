'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { api } from '@/convex/_generated/api';
import { UserButton } from '@/features/auth/components/user-button';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { Id } from '@/convex/_generated/dataModel';
import { ChatLayout } from '@/features/chat/components/ChatLayout';
import { MessageItem } from '@/features/chat/components/MessageItem';
import { Message, ChannelMessage, DirectMessage } from '@/features/chat/types';
import { ThreadPanel } from '@/features/chat/components/ThreadPanel';
import { useActivityStatus } from '@/features/chat/hooks/use-activity-status';
import { UserStatusIndicator } from "@/features/chat/components/UserStatusIndicator";

interface Channel {
  _id: Id<"channels">;
  name: string;
}

interface DirectMessageUser {
  _id: Id<"users">;
  name?: string;
  email: string;
  status?: 'online' | 'offline' | 'away' | 'active';
}

type ChatMode = 'channel' | 'direct';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [showChannelInput, setShowChannelInput] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedUser, setSelectedUser] = useState<DirectMessageUser | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('channel');
  const [messageInput, setMessageInput] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add activity status tracking
  useActivityStatus();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get the current user
  const { data: user } = useCurrentUser();

  // Fetch the current channels
  const channels = useQuery(api.channels.listChannels) || [];
  
  // Fetch all users except current user
  const users = useQuery(
    api.users.listUsers,
    user?._id ? { currentUserId: user._id } : "skip"
  ) || [];

  // Fetch messages based on mode
  const channelMessages = useQuery(
    api.messages.getMessages,
    selectedChannel && chatMode === 'channel' ? { channelId: selectedChannel._id } : "skip"
  ) || [];

  const directMessages = useQuery(
    api.direct_messages.getDirectMessages,
    selectedUser && chatMode === 'direct' && user?._id
      ? { userId1: user._id, userId2: selectedUser._id }
      : "skip"
  ) || [];

  const messages = chatMode === 'channel' ? channelMessages : directMessages;

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prepare mutations
  const createChannel = useMutation(api.channels.createChannel);
  const sendChannelMessage = useMutation(api.messages.sendMessage);
  const sendDirectMessage = useMutation(api.direct_messages.sendDirectMessage);
  const updateStatus = useMutation(api.users.updateStatus);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Update user status when component mounts
  useEffect(() => {
    if (user?._id) {
      updateStatus({ userId: user._id, status: 'online' });
    }
  }, [user?._id]);

  if (!isAuthenticated) {
    return null;
  }

  async function handleChannelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || !user?._id) return;
    await createChannel({ 
      name: channelName.trim(),
      createdBy: user._id
    });
    setChannelName('');
    setShowChannelInput(false);
  }

  function handleChannelSelect(channel: Channel) {
    setSelectedChannel(channel);
    setSelectedUser(null);
    setChatMode('channel');
    setIsThreadOpen(false);
    setSelectedMessage(null);
  }

  function handleUserSelect(selectedUser: DirectMessageUser) {
    setSelectedUser(selectedUser);
    setSelectedChannel(null);
    setChatMode('direct');
    setIsThreadOpen(false);
    setSelectedMessage(null);
  }

  const handleThreadOpen = (message: Message) => {
    setSelectedMessage(message);
    setIsThreadOpen(true);
  };

  const handleThreadClose = () => {
    setIsThreadOpen(false);
    setSelectedMessage(null);
  };

  async function handleMessageSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !user?._id) return;

    if (chatMode === 'channel' && selectedChannel) {
      await sendChannelMessage({
        content: messageInput.trim(),
        channelId: selectedChannel._id,
        authorId: user._id,
      });
    } else if (chatMode === 'direct' && selectedUser) {
      await sendDirectMessage({
        content: messageInput.trim(),
        senderId: user._id,
        receiverId: selectedUser._id,
      });
    }
    
    setMessageInput('');
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  return (
    <ChatLayout>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 text-white flex flex-col">
          {/* Workspace Header */}
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-semibold">Workspace</h1>
          </div>

          {/* Channels Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-400 uppercase">
                Channels
              </h2>
              <button
                className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-700"
                onClick={() => setShowChannelInput(!showChannelInput)}
              >
                +
              </button>
            </div>
            {showChannelInput && (
              <form onSubmit={handleChannelSubmit} className="mb-2 space-y-2">
                <input
                  type="text"
                  placeholder="New channel name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-2 py-1 text-black rounded"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 rounded py-1 hover:bg-blue-500"
                >
                  Create Channel
                </button>
              </form>
            )}
            <ul className="space-y-1">
              {channels.map((channel: Channel) => (
                <li
                  key={channel._id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`hover:bg-gray-700 rounded px-2 py-1 cursor-pointer ${
                    selectedChannel?._id === channel._id && chatMode === 'channel'
                      ? 'bg-gray-700'
                      : ''
                  }`}
                >
                  # {channel.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Messages Section */}
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">
              Direct Messages
            </h2>
            <ul className="space-y-1">
              {users.map((otherUser: DirectMessageUser) => (
                <li
                  key={otherUser._id}
                  onClick={() => handleUserSelect(otherUser)}
                  className={`hover:bg-gray-700 rounded px-2 py-1 cursor-pointer flex items-center ${
                    selectedUser?._id === otherUser._id && chatMode === 'direct'
                      ? 'bg-gray-700'
                      : ''
                  }`}
                >
                  <UserStatusIndicator status={otherUser.status} className="mr-2" />
                  {otherUser.name || otherUser.email}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <header className="h-14 border-b dark:border-gray-800 flex items-center justify-between px-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">
                {chatMode === 'channel' && selectedChannel
                  ? `# ${selectedChannel.name}`
                  : chatMode === 'direct' && selectedUser
                  ? selectedUser.name || selectedUser.email
                  : 'Select a conversation'}
              </h2>
            </div>
            <UserButton />
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: any) => {
              // For direct messages
              if (chatMode === 'direct') {
                const message: DirectMessage = {
                  _id: msg._id,
                  content: msg.content,
                  authorId: msg.senderId,
                  author: {
                    name: msg.author?.name || '',
                    email: msg.author?.email || '',
                  },
                  timestamp: undefined,
                  createdAt: msg.createdAt,
                  senderId: msg.senderId,
                  receiverId: msg.receiverId,
                };
                return (
                  <MessageItem
                    key={msg._id}
                    message={message}
                  />
                );
              }
              
              // For channel messages
              const message: ChannelMessage = {
                _id: msg._id,
                content: msg.content,
                authorId: msg.authorId,
                author: {
                  name: msg.author?.name || '',
                  email: msg.author?.email || '',
                },
                channelId: msg.channelId,
                timestamp: msg.timestamp,
                createdAt: msg.createdAt,
                threadId: msg.threadId,
                hasThreadReplies: msg.hasThreadReplies,
                replyCount: msg.replyCount,
              };
              return (
                <MessageItem
                  key={msg._id}
                  message={message}
                  onThreadClick={handleThreadOpen}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t dark:border-gray-800">
            <form onSubmit={handleMessageSubmit} className="flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
      <ThreadPanel
        isOpen={isThreadOpen}
        originalMessage={selectedMessage}
        onClose={handleThreadClose}
      />
    </ChatLayout>
  );
} 