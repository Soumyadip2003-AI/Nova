# Nova - AI-Powered Code Generation Platform

> Build full-stack applications through natural language conversations with GPT-5.1

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Live Demo](https://your-demo-url.com) · [Report Bug](https://github.com/yourusername/nova/issues) · [Request Feature](https://github.com/yourusername/nova/issues)

</div>

---

## 🌟 Overview

**Nova** is a revolutionary AI-powered development platform that transforms natural language descriptions into production-ready Next.js applications. Built with GPT-5.1 and powered by autonomous AI agents, Nova enables developers to generate, iterate, and deploy full-stack web applications through simple conversations.

### ✨ Key Features

- **🤖 AI-Powered Code Generation**: GPT-5.1 agents write production-quality code based on your descriptions
- **💬 Interactive Chat Interface**: Ask questions, request features, and iterate on your codebase conversationally
- **🔄 Live Preview**: Instant sandboxed preview of generated applications with hot reload
- **📝 Version History**: Track and manage multiple iterations (fragments) of your project
- **🎨 Modern UI**: Beautiful, responsive interface built with Tailwind CSS and shadcn/ui
- **🔐 Secure Authentication**: User management powered by Clerk
- **💳 Flexible Pricing**: Free tier + Pro plan with Clerk Commerce integration
- **⚡ Real-time Updates**: Live progress tracking with "thinking" indicators
- **🎯 Smart Credit System**: Usage-based pricing with automatic reset cycles

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- [Next.js 15.5.6](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Lucide Icons](https://lucide.dev/) - Icon system

**Backend**
- [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [PostgreSQL](https://www.postgresql.org/) (Neon) - Database
- [Zod](https://zod.dev/) - Schema validation

**AI & Agents**
- [GPT-5.1](https://openai.com/) - Latest OpenAI model
- [Inngest Agent Kit](https://www.inngest.com/) - AI agent orchestration
- [E2B Sandboxes](https://e2b.dev/) - Secure code execution environments
- [OpenAI SDK](https://github.com/openai/openai-node) - AI completions

**Authentication & Payments**
- [Clerk](https://clerk.com/) - User authentication & management
- [Clerk Commerce](https://clerk.com/docs/products/commerce) - Subscription & payment processing

**Infrastructure**
- [Vercel](https://vercel.com/) - Deployment platform
- [Inngest](https://www.inngest.com/) - Background job processing
- [Neon](https://neon.tech/) - Serverless Postgres

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **PostgreSQL**: Neon database (or local Postgres)
- **Accounts**: Clerk, OpenAI, E2B, Inngest

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# OpenAI
OPENAI_API_KEY="sk-..."

# E2B Sandboxes
E2B_API_KEY="e2b_..."
E2B_TEMPLATE_ID="..."

# Inngest
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nova.git
cd nova
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npm run prisma:seed
```

4. **Start the development server**
```bash
npm run dev
```

5. **Start Inngest dev server** (in a separate terminal)
```bash
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Usage

### Creating Your First Project

1. **Sign up / Sign in** using Clerk authentication
2. **Create a new project** by describing what you want to build
3. **Watch the AI agent** generate your application in real-time
4. **Preview** the live application in the embedded sandbox
5. **Iterate** by asking questions or requesting changes
6. **Download** or deploy your generated code

### Example Prompts

```
"Create a beautiful landing page for a SaaS product with a hero section,
features grid, pricing table, and contact form"

"Build a todo app with drag-and-drop functionality and local storage"

"Make a weather dashboard that shows current conditions and a 7-day forecast"
```

### Credit System

- **Free Tier**: 5 monthly credits
- **Pro Plan**: 100 monthly credits
- **Cost**: 1 credit per generation or question
- **Reset**: Credits reset every 30 days
- **Upgrade**: Subscribe to Pro via Clerk Commerce

---

## 🏛️ Project Structure

```
nova/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (home)/           # Public pages
│   │   ├── projects/         # Project pages
│   │   └── api/              # API routes
│   ├── components/           # Shared components
│   │   └── ui/               # shadcn/ui components
│   ├── modules/              # Feature modules
│   │   ├── home/
│   │   ├── messages/
│   │   ├── projects/
│   │   └── usage/
│   ├── inngest/              # Inngest functions & agents
│   │   ├── client.ts
│   │   ├── functions.ts      # AI agent logic
│   │   └── utils.ts
│   ├── lib/                  # Utility libraries
│   │   ├── db.ts             # Prisma client
│   │   ├── usage.ts          # Credit management
│   │   └── thinking-helpers.ts
│   ├── trpc/                 # tRPC configuration
│   │   ├── init.ts
│   │   └── routers/
│   ├── hooks/                # React hooks
│   ├── middleware.ts         # Auth middleware
│   └── prompt.ts             # AI prompts
├── public/                   # Static assets
├── .env                      # Environment variables
├── package.json
└── tsconfig.json
```

---

## 🤖 How It Works

### 1. **User Input**
User describes their desired application in natural language through the chat interface.

### 2. **Credit Validation**
System checks if user has sufficient credits before starting generation.

### 3. **Agent Orchestration**
Inngest triggers an autonomous AI agent powered by GPT-5.1 with:
- Custom system prompt optimized for Next.js 15
- Tool access (terminal, file operations)
- Sandbox environment for code execution

### 4. **Code Generation**
The AI agent:
- Analyzes the request
- Plans the implementation
- Writes production-quality code
- Installs necessary dependencies
- Tests the application in the sandbox

### 5. **Live Preview**
Generated code runs in an isolated E2B sandbox with:
- Live preview URL
- Hot reload enabled
- 20-minute timeout for Pro users
- Full Next.js environment

### 6. **Iteration**
Users can:
- Ask questions about the generated code
- Request modifications or new features
- View previous versions (fragments)
- Download the complete codebase

### 7. **Credit Consumption**
- Credits consumed upfront (prevents abuse)
- Automatic refund if generation fails
- Database-level protection with CHECK constraints
- Atomic operations prevent race conditions

---

## 🔒 Security & Architecture Patterns

### Credit System Protection

**Problem**: Race conditions could allow negative credits or free generations during DB failures.

**Solution**: Consume-upfront-refund-on-failure pattern
```typescript
// 1. Consume credits BEFORE expensive operation
await consumeCreditsForUser(userId);

try {
  // 2. Run expensive operation (code generation)
  await generateCode();
} catch (error) {
  // 3. Automatic refund on failure
  await refundCreditsForUser(userId);
  throw error;
}
```

**Database Protection**:
```sql
ALTER TABLE "Usage"
ADD CONSTRAINT "Usage_points_check"
CHECK ("points" >= 0);
```

### Authentication Flow

1. **Clerk Middleware**: Protects routes based on authentication status
2. **Public Routes**: `/`, `/sign-in`, `/sign-up`, `/pricing`, `/api/*`
3. **Protected Routes**: Everything else requires authentication
4. **Session Management**: Handled automatically by Clerk

### Sandbox Security

- **Isolated Environments**: Each generation runs in a separate E2B sandbox
- **Timeout Limits**: Automatic termination after configured duration
- **Resource Constraints**: CPU and memory limits enforced
- **No External Access**: Sandboxes cannot access external services

---

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) for consistency and accessibility:

- **Buttons**: Primary, secondary, outline, ghost variants
- **Cards**: Project cards, feature cards, pricing cards
- **Dialogs**: Modals for confirmations and forms
- **Forms**: Validated forms with react-hook-form + Zod
- **Alerts**: Success, error, warning, info messages
- **Progress**: Loading states and progress indicators
- **Badges**: Status badges for plans and features
- **Tooltips**: Contextual help and information
- **Toasts**: Non-blocking notifications with Sonner

---

## 📊 Database Schema

### Core Models

**Project**
```prisma
model Project {
  id        String   @id @default(uuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}
```

**Message**
```prisma
model Message {
  id        String      @id @default(uuid())
  content   String?
  role      MessageRole  // USER | ASSISTANT
  type      MessageType  // RESULT | ERROR | THINKING | CHAT
  thinking  Json?       // Progress tracking
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  project   Project     @relation(...)
  projectId String
  fragment  Fragment?
}
```

**Fragment**
```prisma
model Fragment {
  id         String  @id @default(uuid())
  messageId  String  @unique
  message    Message @relation(...)
  sandboxUrl String
  title      String
  files      Json    // Generated code files
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Usage**
```prisma
model Usage {
  key     String   @id      // userId
  points  Int                // Remaining credits
  expire  DateTime           // Reset date
  plan    UserPlan @default(FREE)  // FREE | PRO
}
```

---

## 🔄 API Routes

### tRPC Procedures

**Projects**
- `projects.getMany` - List user's projects
- `projects.getOne` - Get project by ID
- `projects.create` - Create new project (triggers AI generation)
- `projects.remove` - Delete project

**Messages**
- `messages.getMany` - List project messages
- `messages.create` - Send message (question or code request)

**Usage**
- `usage.getStatus` - Get current credit status
- `usage.subscribe` - Subscribe to Pro plan

### REST API Endpoints

- `POST /api/upgrade-to-pro` - Manual Pro upgrade
- `GET /api/test-usage` - Test usage status (dev only)
- `POST /api/test-consume-credit` - Test credit consumption (dev only)
- `GET /api/debug-subscription` - Debug Clerk subscription (dev only)

---

## 🎯 Performance Optimizations

### Client-Side
- **React Server Components**: Reduced client bundle size
- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js Font optimization
- **Lazy Loading**: Components loaded on demand

### Server-Side
- **Database Connection Pooling**: Prisma with Neon
- **Query Optimization**: Indexed fields and selective includes
- **Caching**: React Query for client-side caching
- **Background Jobs**: Inngest for async processing
- **Streaming**: Real-time updates with Server-Sent Events

### Database
- **Indexes**: Strategic indexes on frequently queried fields
- **Constraints**: CHECK constraints for data integrity
- **Cascade Deletes**: Automatic cleanup of related records
- **Atomic Operations**: Prevent race conditions

---

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (if configured)
npm test

# Build production bundle
npm run build
```

---

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
- Connect your GitHub repository
- Configure environment variables
- Deploy

3. **Set up Webhooks**
- Configure Clerk webhooks for user events
- Set up Inngest webhook endpoints

### Environment Setup

Ensure all production environment variables are configured:
- Database connection (Neon)
- Clerk keys (production)
- OpenAI API key
- E2B API key & template
- Inngest production keys

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Vercel](https://vercel.com/) - Platform for deployment
- [Clerk](https://clerk.com/) - Authentication and user management
- [OpenAI](https://openai.com/) - GPT-5.1 AI model
- [E2B](https://e2b.dev/) - Secure code execution sandboxes
- [Inngest](https://www.inngest.com/) - Background job processing
- [shadcn](https://ui.shadcn.com/) - Beautiful UI components
- [Prisma](https://www.prisma.io/) - Next-generation ORM

---

## 💬 Support

- **Documentation**: [docs.example.com](https://docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/nova/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/nova/discussions)
- **Email**: support@example.com

---

## 🗺️ Roadmap

- [ ] **Multi-language Support**: Support for Python, Go, Rust backends
- [ ] **Team Collaboration**: Share projects with team members
- [ ] **Version Control**: Git integration and commit history
- [ ] **Templates**: Pre-built project templates
- [ ] **API Export**: Export projects as REST APIs
- [ ] **Mobile App**: iOS and Android applications
- [ ] **Custom Models**: Fine-tuned models for specific frameworks
- [ ] **Enterprise Plan**: Advanced features for organizations

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/nova?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/nova?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/nova?style=social)

---

<div align="center">

**Built with ❤️ by the Nova Team**

[Website](https://example.com) · [Twitter](https://twitter.com/nova) · [Discord](https://discord.gg/nova)

</div>
