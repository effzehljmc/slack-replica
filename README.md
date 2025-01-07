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

- Git
- One of the following setups:
  
  **Option 1: Local Development**
  - Node.js 18+ 
  - npm or yarn

  **Option 2: Docker Development**
  - Docker Desktop ([Install Guide](#docker-installation))
  - Docker Compose (included in Docker Desktop)

### Docker Installation

#### macOS
1. Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Double-click the downloaded `.dmg` file
3. Drag Docker to Applications
4. Open Docker from Applications
5. Follow the installation wizard

#### Windows
1. Enable WSL 2 (Windows Subsystem for Linux):
   ```powershell
   wsl --install
   ```
2. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
3. Run the installer
4. Follow the installation wizard
5. Restart your computer

#### Linux (Ubuntu)
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up stable repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply changes (you'll need to log out and back in)
newgrp docker
```

### Verify Installation
After installation, verify Docker is working:
```bash
docker --version
docker compose version
```

### Environment Setup

1. Get your Convex URL:
   - Go to [Convex Dashboard](https://dashboard.convex.dev)
   - Create a new project or select an existing one
   - Click on "Settings" in the left sidebar
   - Copy the "Deployment URL" under "General"

2. Create your environment file:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

3. Edit the `.env` file:
   - Replace `your_convex_deployment_url` with your actual Convex URL
   - Example: `NEXT_PUBLIC_CONVEX_URL=https://cheerful-panda-123.convex.cloud`

### Installation

#### Option 1: Local Development

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

#### Option 2: Docker Development

1. Clone the repository:
```bash
git clone https://github.com/effzehljmc/slack-replica.git
cd slack-replica
```

2. Create a `.env` file with your environment variables:
```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

3. Build and run with Docker Compose:
```bash
docker-compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

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

### Option 1: Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Option 2: Docker Deployment

1. Build the Docker image:
```bash
docker-compose build
```

2. Run in production:
```bash
docker-compose up -d
```

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
