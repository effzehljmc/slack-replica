# Slack Replica

A modern real-time chat application built with Next.js 14, featuring a sleek UI and robust functionality similar to Slack.

## Features

- 🔐 **Authentication System**
  - Email & Password authentication
  - Modern, responsive login/signup UI
  - Secure session management

- 💬 **Real-time Messaging**
  - Instant message delivery
  - Message history persistence
  - Support for text messages

- 📱 **Responsive Design**
  - Modern UI with Tailwind CSS
  - Mobile-first approach
  - Smooth animations and transitions

## Tech Stack

- **Frontend:**
  - Next.js 14 (App Router)
  - React
  - Tailwind CSS
  - TypeScript

- **Backend:**
  - Convex (Real-time Database)
  - Next.js API Routes

- **Authentication:**
  - Custom authentication system
  - Secure password hashing
  - Session management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/effzehljmc/slack-replica.git
cd slack-replica
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
slack-replica/
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # Reusable UI components
│   ├── features/        # Feature-specific components
│   │   ├── auth/        # Authentication related components
│   │   └── chat/        # Chat related components
│   └── lib/            # Utility functions and helpers
├── convex/             # Convex backend functions
├── public/            # Static assets
└── ...config files
```

## Development

- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Deployment

The application can be deployed on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Convex for real-time database capabilities
- Tailwind CSS for the styling system
