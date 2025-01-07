'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { api } from '@/convex/_generated/api';
import { UserButton } from '@/features/auth/components/user-button';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { Id } from '@/convex/_generated/dataModel';

interface Channel {
  _id: Id<"channels">;
  name: string;
}

interface DirectMessageUser {
  _id: Id<"users">;
  name?: string;
  email: string;
  status?: string;
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
  }

  function handleUserSelect(selectedUser: DirectMessageUser) {
    setSelectedUser(selectedUser);
    setSelectedChannel(null);
    setChatMode('direct');
  }

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
    <div className="h-screen flex">
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
                className={`hover:bg-gray-700 rounded px-2 py-1 cursor-pointer ${
                  selectedUser?._id === otherUser._id && chatMode === 'direct'
                    ? 'bg-gray-700'
                    : ''
                }`}
              >
                <span className={`w-2 h-2 ${
                  otherUser.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                } rounded-full inline-block mr-2`}></span>
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
          {messages.map((message: any) => (
            <div key={message._id} className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {(chatMode === 'channel' 
                  ? message.author?.name?.[0] || message.author?.email[0]
                  : message.sender?.name?.[0] || message.sender?.email[0]
                ).toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-medium">
                    {chatMode === 'channel'
                      ? message.author?.name || message.author?.email
                      : message.sender?.name || message.sender?.email}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        {(selectedChannel || selectedUser) && (
          <form onSubmit={handleMessageSubmit} className="p-4 border-t dark:border-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={
                  chatMode === 'channel'
                    ? `Message #${selectedChannel?.name}`
                    : `Message ${selectedUser?.name || selectedUser?.email}`
                }
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 