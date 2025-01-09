# Slack Replica

A modern real-time chat application built with Next.js 14, featuring real-time messaging and a sleek UI.

## Features

- 🔐 **Authentication System**
  - Email & Password authentication
  - Modern, responsive login/signup UI

- 💬 **Real-time Messaging**
  - Instant message delivery
  - Message history persistence
  - Thread support with dedicated panel
  - Seamless conversation threading

- 🧵 **Advanced Search**
  - Real-time search across messages and DMs
  - Filter by date range, user, and channel
  - Keyboard shortcuts (⌘K to open, Esc to close)
  - Message highlighting with context
  - Smart navigation to search results
  - Recent searches functionality

- 🧵 **Thread Features**
  - Click messages to open threads
  - Dedicated right-side panel for thread discussions
  - Easy thread navigation with close button
  - Original message context preserved
  - Smart panel management (auto-closes when switching channels)
  - Smooth transitions and animations

- 📱� **Direct Messages**
  - Private one-on-one conversations
  - Real-time message delivery
  - Seamless switching between channels and DMs
  - Message history persistence
  - User online/away status indicators

- 👍 **Message Reactions**
  - Six emoji reactions available (👍 ❤️ 😂 😮 😢 🎉)
  - Multiple reactions per message
  - Real-time reaction updates
  - Reaction counts and user tracking
  - Easy-to-use reaction picker

- ✏️ **Message Management**
  - Edit your own messages
  - Delete messages with confirmation
  - Visual indicators for edited messages
  - Graceful handling of thread message deletion
  - Keyboard shortcuts for editing (Enter to save, Escape to cancel)

- 📱 **Modern UI**
  - Clean, responsive design
  - Built with Tailwind CSS
  - Adaptive layout for thread views
  - Intuitive visual hierarchy
  - Smooth transitions and animations

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) - Fast JavaScript runtime and package manager
- [Node.js](https://nodejs.org) - Version 18 or higher
- [Git](https://git-scm.com) - For cloning the repository

### Installation

1. Clone the repository:
```bash
git clone https://github.com/effzehljmc/slack-replica.git
cd slack-replica
```

2. Install dependencies:
```bash
bun install
```

3. Set up your environment:
   - Copy the example environment file:
     ```bash
     cp .env.example .env.local
     ```
   - Edit `.env.local` and add your Convex URL:
     ```env
     NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
     ```

### Running the App

1. Start the Convex development server:
```bash
bunx convex dev
```

2. In a new terminal, start the Next.js development server:
```bash
bun run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Development Commands

- `bun run dev` - Start the development server
- `bunx convex dev` - Start the Convex backend
- `bun run build` - Build the application
- `bun run lint` - Run linting
- `bun run format` - Format code

## Project Structure

```
slack-replica/
├── src/
│   ├── app/             # Next.js pages
│   ├── components/      # UI components
│   └── features/        # Feature modules
│       ├── auth/        # Authentication
│       ├── chat/        # Messaging & threads
│           ├── components/    # Chat UI components
│           │   ├── MessageItem.tsx      # Message display
│           │   ├── MessageReactions.tsx  # Reaction system
│           │   ├── ThreadPanel.tsx      # Thread UI
│           │   └── ThreadMessageList.tsx # Thread messages
│           └── types.ts       # Type definitions
│       └── ui/          # Shared UI components
├── convex/              # Backend functions
│   ├── messages.ts      # Channel messages
│   ├── direct_messages.ts # Private messages
│   ├── reactions.ts     # Message reactions
│   ├── channels.ts      # Channel management
│   └── schema.ts        # Database schema
└── public/             # Static assets
```

## Key Features

### Thread Support
- **Thread Panel**: Dedicated right-side panel for focused discussions
- **Context Preservation**: Original message always visible in thread view
- **Smart Navigation**: 
  - Auto-closes when switching channels
  - Auto-closes when switching to private messages
  - Only one thread active at a time
- **Visual Feedback**:
  - Messages show thread indicators
  - Smooth transitions when opening/closing threads
  - Adaptive layout adjustments

### UI/UX Improvements
- **Space Management**: Optimized layout for thread panel integration
- **Visual Hierarchy**: Clear distinction between main chat and threads
- **Transitions**: Smooth animations for panel operations
- **Responsive Design**: Adapts to different screen sizes

### User Status Features
- **Visual Status Indicators**: 
  - Green dot for active users
  - Orange dot for away users
  - Status indicator next to usernames
- **Manual Status Control**:
  - Toggle between "Active" and "Away" states
  - Status persists across sessions
  - Accessible via user profile dropdown
- **Status Display**:
  - Clear visual feedback of current status
  - Status shown in user lists and messages

### Search Functionality
- **Global Search**: Search across all messages and direct messages
- **Smart Filtering**:
  - Date range picker for temporal filtering
  - User filter for finding specific authors
  - Channel filter for focused searches
- **Rich Results**:
  - Context-aware result display
  - Highlighted search terms
  - Message timestamps and authors
  - One-click navigation to messages
- **User Experience**:
  - Keyboard shortcuts for quick access
  - Loading states and error handling
  - Empty state handling
  - Recent searches suggestions
- **Performance**:
  - Debounced search for optimal performance
  - Efficient client-side filtering
  - Smooth animations and transitions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changes
This PR introduces user status functionality with visual indicators and manual controls:

### Added Components
- `UserStatusIndicator`: Visual dot indicator showing active/away status
- Status toggle in UserButton dropdown menu
- Status display in user lists

### Visual Changes
- Green dot: Active users
- Orange dot: Away users
- Updated user dropdown with status toggle option

### Technical Changes
- Enhanced UserButton component with status controls
- Added status-related styling
- Updated README with status feature documentation

## Screenshots
[Insert screenshots here showing:]
1. Status indicator dots in action
2. User dropdown with status toggle
3. Status display in user lists

## Testing Instructions
1. **Manual Status Toggle:**
   - Click your profile picture/avatar
   - Look for "Set as Away"/"Set as Active" in dropdown
   - Toggle between states
   - Verify visual indicator changes

2. **Status Persistence:**
   - Set a status
   - Refresh page
   - Verify status remains unchanged

3. **Visual Indicators:**
   - Check that active users show green dots
   - Check that away users show orange dots
   - Verify indicators appear next to usernames

## Dependencies
- No new dependencies added
- Uses existing styling system

## Notes
- Status is persisted in database
- Compatible with existing user system
- No breaking changes

## Technical Implementation

### Message System
- **Dual Message Types**: Supports both channel messages and direct messages
- **Real-time Updates**: Uses Convex's real-time capabilities
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Message States**: Handles editing, deletion, and thread replies

### Reaction System
- **Emoji Support**: Six predefined emoji reactions
- **User Tracking**: Tracks who reacted with what
- **Real-time Updates**: Instant reaction synchronization
- **Optimized Storage**: Efficient reaction data structure

### Database Schema
- **Messages**: Stores channel messages with thread support
- **Direct Messages**: Handles private conversations
- **Reactions**: Flexible reaction system for both message types
- **Users**: User profiles with status tracking
- **Channels**: Channel management and metadata

### Search System
- **Real-time Search**: Instant results as you type
- **Filter Combinations**: Multiple filters can be combined
- **Context Preservation**: Shows message context in results
- **Navigation**: Smart scroll to message on selection
- **State Management**: Centralized search context
- **Accessibility**: Keyboard navigation and ARIA labels
