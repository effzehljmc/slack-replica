# Slack Replica

A modern real-time chat application built with Next.js 14, featuring real-time messaging and a sleek UI.

## Features

- 🔐 **Authentication System**
  - Email & Password authentication
  - Modern, responsive login/signup UI

- 💬 **Real-time Messaging**
  - Instant message delivery
  - Message history persistence

- 📱 **Modern UI**
  - Clean, responsive design
  - Built with Tailwind CSS

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
├── convex/              # Backend functions
└── public/             # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
