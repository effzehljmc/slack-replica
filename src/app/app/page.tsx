'use client';

import { useState } from "react";

export default function AppPage() {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send message
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Example Messages */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            J
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="font-medium">John Doe</span>
              <span className="text-xs text-gray-500">12:34 PM</span>
            </div>
            <p className="text-gray-800 dark:text-gray-200">
              Hello everyone! Welcome to the channel.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
            J
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="font-medium">Jane Smith</span>
              <span className="text-xs text-gray-500">12:36 PM</span>
            </div>
            <p className="text-gray-800 dark:text-gray-200">
              Hi John! Thanks for setting this up.
            </p>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t dark:border-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
  );
} 