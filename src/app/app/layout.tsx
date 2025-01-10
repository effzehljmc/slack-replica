'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { api } from '@/convex/_generated/api';
import { UserButton } from '@/features/auth/components/user-button';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { Id } from '@/convex/_generated/dataModel';
import { ChatLayout } from '@/features/chat/components/ChatLayout';
import { MessageItem } from '@/features/chat/components/MessageItem';
import { Message, isChannelMessage, isDirectMessage } from '@/features/chat/types';
import { ThreadPanel } from '@/features/chat/components/ThreadPanel';
import { useActivityStatus } from '@/features/chat/hooks/use-activity-status';
import { UserStatusIndicator } from "@/features/chat/components/UserStatusIndicator";
import { SearchProvider } from '@/features/search/context/search-context';
import { SearchContainer } from '@/features/search/components/SearchContainer';
import { FileUpload } from '@/features/chat/components/FileUpload';
import { ThemeToggle } from '@/components/theme-toggle';
import { TypingIndicator } from "@/features/chat/components/TypingIndicator";
import { WelcomeScreen } from '@/features/chat/components/WelcomeScreen';

interface Channel {
  _id: Id<"channels">;
  name: string;
}

interface DirectMessageUser {
  _id: Id<"users">;
  name?: string;
  email: string;
  status?: 'online' | 'offline' | 'away';
}

type ChatMode = 'channel' | 'direct';

type NavigateToMessageEventDetail = {
  type: 'channel' | 'direct';
  channelId?: Id<"channels">;
  userId?: Id<"users">;
  messageId: Id<"messages"> | Id<"direct_messages">;
};

declare global {
  interface WindowEventMap {
    'navigate-to-message': CustomEvent<NavigateToMessageEventDetail>;
  }
}

export default function AppLayout() {
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
  const [attachmentId, setAttachmentId] = useState<Id<"attachments"> | null>(null);
  const [channelSearch, setChannelSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const updateTypingStatus = useMutation(api.typing.updateTypingStatus);
  const removeTypingStatus = useMutation(api.typing.removeTypingStatus);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Get the current user
  const { data: user } = useCurrentUser();

  // Fetch channels and users data
  const channelsQuery = useQuery(api.channels.listChannels);
  const usersQuery = useQuery(
    api.users.listUsers,
    user?._id ? { currentUserId: user._id } : "skip"
  );

  // Memoize channels and users lists
  const channels = useMemo(() => channelsQuery || [], [channelsQuery]);
  const users = useMemo(() => usersQuery || [], [usersQuery]);

  // Memoize the event handler functions
  const handleChannelSelect = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    setSelectedUser(null);
    setChatMode('channel');
    setIsThreadOpen(false);
    setSelectedMessage(null);
  }, []);

  const handleUserSelect = useCallback((selectedUser: DirectMessageUser) => {
    setSelectedUser(selectedUser);
    setSelectedChannel(null);
    setChatMode('direct');
    setIsThreadOpen(false);
    setSelectedMessage(null);
  }, []);

  // Add activity status tracking
  useActivityStatus();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages based on mode
  const channelMessages = useQuery(
    api.messages.getMessages,
    selectedChannel && chatMode === 'channel' ? { channelId: selectedChannel._id } : "skip"
  );
  
  const directMessages = useQuery(
    api.direct_messages.getDirectMessages,
    selectedUser && chatMode === 'direct' && user?._id
      ? { userId1: user._id, userId2: selectedUser._id }
      : "skip"
  );

  // Use type inference from the query results and map them to the correct types
  const messages = useMemo(() => {
    if (chatMode === 'channel' && channelMessages) {
      return channelMessages.map(msg => ({
        ...msg,
        _id: msg._id,
        authorId: msg.authorId,
        channelId: msg.channelId,
        author: msg.author || { name: '', email: '' },
        createdAt: msg._creationTime,
      }));
    } else if (chatMode === 'direct' && directMessages) {
      return directMessages.map(msg => ({
        ...msg,
        _id: msg._id,
        authorId: msg.senderId,
        author: msg.author || { name: '', email: '' },
        createdAt: msg._creationTime,
      }));
    }
    return [];
  }, [chatMode, channelMessages, directMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prepare mutations
  const createChannel = useMutation(api.channels.createChannel);
  const sendChannelMessage = useMutation(api.messages.sendMessage);
  const sendDirectMessage = useMutation(api.direct_messages.sendDirectMessage);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Handle navigation from search results
  useEffect(() => {
    function handleEvent(event: Event): void {
      if (!(event instanceof CustomEvent)) return;
      
      const detail = event.detail;
      if (
        detail &&
        typeof detail === 'object' &&
        'type' in detail &&
        typeof detail.type === 'string' &&
        (detail.type === 'channel' || detail.type === 'direct') &&
        ('channelId' in detail || 'userId' in detail) &&
        'messageId' in detail
      ) {
        const typedDetail = detail as NavigateToMessageEventDetail;
        const { type, channelId, userId, messageId } = typedDetail;

        if (type === 'channel' && channelId) {
          // Switch to channel
          const channel = channels.find(c => c._id === channelId);
          if (channel) {
            handleChannelSelect(channel);
            // Scroll to message after messages are loaded
            const checkAndScrollToMessage = () => {
              const messageElement = document.getElementById(`message-${messageId}`);
              if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
                setTimeout(() => {
                  messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
                }, 2000);
              } else {
                // Try again in 100ms if message not found (messages might still be loading)
                setTimeout(checkAndScrollToMessage, 100);
              }
            };
            setTimeout(checkAndScrollToMessage, 100);
          }
        } else if (type === 'direct' && userId) {
          // Switch to DM
          const user = users.find(u => u._id === userId);
          if (user) {
            handleUserSelect(user);
            // Scroll to message after messages are loaded
            const checkAndScrollToMessage = () => {
              const messageElement = document.getElementById(`message-${messageId}`);
              if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
                setTimeout(() => {
                  messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
                }, 2000);
              } else {
                // Try again in 100ms if message not found (messages might still be loading)
                setTimeout(checkAndScrollToMessage, 100);
              }
            };
            setTimeout(checkAndScrollToMessage, 100);
          }
        }
      }
    }

    window.addEventListener('navigate-to-message', handleEvent);
    return () => window.removeEventListener('navigate-to-message', handleEvent);
  }, [channels, users, handleChannelSelect, handleUserSelect]);

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!user?._id) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Update typing status based on chat mode
    if (chatMode === 'channel' && selectedChannel) {
      updateTypingStatus({
        userId: user._id,
        channelId: selectedChannel._id,
        chatType: "channel",
      });
    } else if (chatMode === 'direct' && selectedUser) {
      updateTypingStatus({
        userId: user._id,
        receiverId: selectedUser._id,
        chatType: "direct",
      });
    }

    // Set timeout to remove typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (!user?._id) return;

      if (chatMode === 'channel' && selectedChannel) {
        removeTypingStatus({
          userId: user._id,
          channelId: selectedChannel._id,
          chatType: "channel",
        });
      } else if (chatMode === 'direct' && selectedUser) {
        removeTypingStatus({
          userId: user._id,
          receiverId: selectedUser._id,
          chatType: "direct",
        });
      }
    }, 3000);
  };

  // Cleanup typing status on unmount or chat change
  useEffect(() => {
    if (!user?._id) return;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (chatMode === 'channel' && selectedChannel) {
        removeTypingStatus({
          userId: user._id,
          channelId: selectedChannel._id,
          chatType: "channel",
        }).catch(console.error);
      } else if (chatMode === 'direct' && selectedUser) {
        removeTypingStatus({
          userId: user._id,
          receiverId: selectedUser._id,
          chatType: "direct",
        }).catch(console.error);
      }
    };
  }, [chatMode, selectedChannel, selectedUser, user, removeTypingStatus]);

  if (!isAuthenticated) {
    return null;
  }

  function handleChannelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || !user?._id) return;
    createChannel({ 
      name: channelName.trim(),
      createdBy: user._id
    });
    setChannelName('');
    setShowChannelInput(false);
  }

  const handleThreadOpen = (message: Message) => {
    if (isChannelMessage(message)) {
      setSelectedMessage(message);
      setIsThreadOpen(true);
    }
  };

  const handleThreadClose = () => {
    setIsThreadOpen(false);
    setSelectedMessage(null);
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageInput.trim() && !attachmentId) return;
    if (!user?._id) return;

    try {
      if (chatMode === 'channel' && selectedChannel) {
        await sendChannelMessage({
          content: messageInput.trim(),
          channelId: selectedChannel._id,
          authorId: user._id,
          attachmentId: attachmentId || undefined,
        });
      } else if (chatMode === 'direct' && selectedUser) {
        await sendDirectMessage({
          content: messageInput.trim(),
          senderId: user._id,
          receiverId: selectedUser._id,
          attachmentId: attachmentId || undefined,
        });
      }
      
      setMessageInput('');
      setAttachmentId(null);
    } catch (error) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'An unknown error occurred';
      }
      console.error('Failed to send message:', errorMessage);
    }
  };

  return (
    <SearchProvider>
      <ChatLayout>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 text-white flex flex-col">
            {/* Workspace Header */}
            <div className="p-4 border-b border-gray-700 flex items-center gap-3">
              <img 
                src="https://cdn.prod.website-files.com/671d0f620752c1fed9d57d14/672d13130d0b313e9e1fa956_mega-creator%20(11)-p-500.png"
                alt="ChatGenius Logo"
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-semibold">ChatGenius</h1>
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
              
              {/* Channel Search */}
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-gray-200 placeholder-gray-400"
                />
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
                {channels
                  .filter(channel => 
                    channel.name.toLowerCase().includes(channelSearch.toLowerCase())
                  )
                  .map((channel: Channel) => (
                  <li
                    key={channel._id}
                    onClick={() => handleChannelSelect(channel)}
                    className={`
                      hover:bg-gray-700 rounded px-2 py-1.5 cursor-pointer
                      transition-all duration-200
                      ${selectedChannel?._id === channel._id && chatMode === 'channel'
                        ? 'bg-gray-700 font-semibold border-l-4 border-blue-500 pl-1'
                        : 'border-l-4 border-transparent'
                      }
                    `}
                  >
                    <span className="flex items-center">
                      <span className="text-gray-400">#</span>
                      <span className="ml-1">{channel.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Messages Section */}
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                Direct Messages
              </h2>
              
              {/* DM Search */}
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-gray-200 placeholder-gray-400"
                />
              </div>

              <ul className="space-y-1">
                {users
                  .filter(user => 
                    (user.name || user.email).toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((otherUser: DirectMessageUser) => (
                  <li
                    key={otherUser._id}
                    onClick={() => handleUserSelect(otherUser)}
                    className={`
                      hover:bg-gray-700 rounded px-2 py-1.5 cursor-pointer
                      transition-all duration-200 flex items-center
                      ${selectedUser?._id === otherUser._id && chatMode === 'direct'
                        ? 'bg-gray-700 font-semibold border-l-4 border-blue-500 pl-1'
                        : 'border-l-4 border-transparent'
                      }
                    `}
                  >
                    <UserStatusIndicator status={otherUser.status} className="mr-2" />
                    <span className="truncate">{otherUser.name || otherUser.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <header className="h-14 border-b dark:border-gray-800 flex items-center justify-between px-4">
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-lg font-semibold">
                  {chatMode === 'channel' && selectedChannel
                    ? `# ${selectedChannel.name}`
                    : chatMode === 'direct' && selectedUser
                    ? selectedUser.name || selectedUser.email
                    : 'Welcome to ChatGenius'}
                </h2>
                <SearchContainer />
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserButton />
              </div>
            </header>

            {/* Messages Area or Welcome Screen */}
            {selectedChannel || selectedUser ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  if (chatMode === 'direct' && isDirectMessage(msg)) {
                    return (
                      <MessageItem
                        key={msg._id}
                        message={msg}
                        isThreadReply={false}
                        onThreadClick={handleThreadOpen}
                        currentUserId={user!._id}
                      />
                    );
                  }

                  if (chatMode === 'channel' && isChannelMessage(msg)) {
                    return (
                      <MessageItem
                        key={msg._id}
                        message={msg}
                        isThreadReply={false}
                        onThreadClick={handleThreadOpen}
                        currentUserId={user!._id}
                      />
                    );
                  }

                  return null;
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <WelcomeScreen
                onJoinGeneral={() => {
                  const generalChannel = channels.find(c => c.name === 'general');
                  if (generalChannel) {
                    handleChannelSelect(generalChannel);
                  } else if (user?._id) {
                    createChannel({ 
                      name: 'general',
                      createdBy: user._id
                    });
                    // The channels list will update automatically through Convex's real-time updates
                  }
                }}
                onCreateChannel={() => setShowChannelInput(true)}
                onSelectUser={(userId) => {
                  const selectedUser = users.find(u => u._id === userId);
                  if (selectedUser) {
                    handleUserSelect(selectedUser);
                  }
                }}
                onlineUsers={users
                  .filter(u => u.status === 'online' && u._id !== user?._id)
                  .map(u => ({
                    id: u._id,
                    name: u.name || u.email
                  }))}
              />
            )}

            {/* Message Input */}
            {(selectedChannel || selectedUser) && (
              <div className="p-4 border-t dark:border-gray-800">
                {user && (chatMode === 'channel' ? (
                  selectedChannel && (
                    <TypingIndicator
                      channelId={selectedChannel._id}
                      chatType="channel"
                      currentUserId={user._id}
                      className="mb-2"
                    />
                  )
                ) : (
                  selectedUser && (
                    <TypingIndicator
                      receiverId={selectedUser._id}
                      chatType="direct"
                      currentUserId={user._id}
                      className="mb-2"
                    />
                  )
                ))}
                <form onSubmit={handleMessageSubmit} className="flex flex-col gap-2">
                  {attachmentId && (
                    <div className="px-2">
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        File attached
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800 px-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleMessageInputChange}
                      placeholder={attachmentId ? "Add a message or send without one" : "Type a message..."}
                      className="flex-1 py-2 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
                    />
                    <FileUpload
                      channelId={chatMode === 'channel' ? selectedChannel?._id : undefined}
                      onUploadComplete={(id) => setAttachmentId(id as Id<"attachments">)}
                      compact
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!messageInput.trim() && !attachmentId}
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Thread Panel */}
          <ThreadPanel
            isOpen={isThreadOpen}
            originalMessage={selectedMessage}
            onClose={handleThreadClose}
          />
        </div>
      </ChatLayout>
    </SearchProvider>
  );
} 