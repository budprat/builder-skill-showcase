# Builder Skill Showcase

A comprehensive platform for managing coding challenges, submissions, and leaderboards. Built with modern web technologies and powered by Supabase.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Security Best Practices](#security-best-practices)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication** - Email/password authentication with Supabase Auth
- **Challenge Management** - Create, edit, and manage coding challenges
- **Submission System** - Submit solutions with repository URLs, pitch decks, and demo videos
- **Leaderboard** - Track participant scores and rankings
- **Admin Panel** - Comprehensive admin interface for managing challenges, users, and submissions
- **Badge System** - Award badges to users for achievements
- **File Upload** - Upload CVs, documents, and other files to Supabase Storage
- **Real-time Notifications** - Get notified about important events
- **User Profiles** - Customizable profiles with GitHub, LinkedIn, and portfolio links
- **Responsive Design** - Mobile-friendly UI built with Tailwind CSS and shadcn-ui

## Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite 5.4.1** - Build tool and dev server
- **React Router 6.26.2** - Client-side routing
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **shadcn-ui** - Component library built on Radix UI
- **TanStack Query 5.56.2** - Data fetching and caching
- **React Hook Form 7.53.0** - Form management
- **Zod** - Schema validation

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage
  - Real-time subscriptions
  - Row Level Security (RLS)

### Development Tools
- **Bun/npm** - Package managers
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **Bun** package manager
- **Supabase Account** - [Sign up for free](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd builder-skill-showcase
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or if using Bun
   bun install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables) section)

### Environment Variables

This project uses environment variables to securely manage API keys and sensitive configuration.

1. **Copy the example environment file**
   ```bash
   cp .env.example .env
   ```

2. **Get your Supabase credentials**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project (or create a new one)
   - Navigate to **Settings** → **API**
   - Copy the **Project URL** and **anon/public** key

3. **Update your `.env` file**
   ```env
   # Required: Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

   # Optional: Test Credentials (for development only)
   VITE_TEST_EMAIL=test@example.com
   VITE_TEST_PASSWORD=your-secure-test-password
   ```

4. **Update Supabase Project ID** (optional)

   Edit `supabase/config.toml` and replace the placeholder:
   ```toml
   project_id = "your-actual-project-id"
   ```

**IMPORTANT:**
- Never commit your `.env` file to version control
- Never share your Supabase keys publicly
- Rotate keys immediately if they are exposed
- Use different credentials for development, staging, and production

### Running the Application

**Development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Project Structure

```
builder-skill-showcase/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn-ui components
│   │   ├── auth/           # Authentication components
│   │   ├── admin/          # Admin panel components
│   │   ├── layout/         # Layout components
│   │   ├── files/          # File upload components
│   │   └── notifications/  # Notification components
│   ├── pages/              # Route pages
│   │   ├── Index.tsx       # Home page
│   │   ├── Auth.tsx        # Authentication page
│   │   ├── Challenges.tsx  # Challenges listing
│   │   ├── ChallengeDetail.tsx
│   │   ├── Dashboard.tsx
│   │   └── Admin.tsx
│   ├── integrations/
│   │   └── supabase/       # Supabase client and types
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── utils/              # Helper utilities
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Application entry point
├── supabase/
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Authentication

This application uses **Supabase Auth** for user authentication.

### User Roles
- **Admin** - Full access to admin panel, challenge management, user management
- **Company** - Can create and manage challenges
- **Participant** - Can view challenges and submit solutions

### Auth Features
- Email/password sign up and sign in
- Session management
- Protected routes
- Auth state persistence
- Automatic cleanup on logout

### Debug Tools (Development Only)
The `DebugAuth` component provides testing utilities:
- Create test accounts
- Test authentication flow
- Check current session

**WARNING:** Remove or disable the debug component in production.

## Database Schema

### Main Tables

**profiles** - User profile information
- id, full_name, username, bio
- github_url, linkedin_url, portfolio_url
- skills, experience_level, location
- avatar_url, cv_url

**challenges** - Coding challenges
- title, description, problem_statement
- company_name, company_logo_url
- prize_amount, submission_deadline
- status, domains, evaluation_rubric
- data_pack_url

**submissions** - User submissions
- challenge_id, participant_id
- repository_url, pitch_deck_url, demo_video_url
- provisional_score, final_score, status
- human_feedback, llm_feedback

**badges** - Achievement badges
- name, description, badge_type
- criteria, icon_url

**user_badges** - User badge assignments
- user_id, badge_id, challenge_id

**user_files** - File uploads
- user_id, file_path, file_name
- file_type, file_size, mime_type

**notifications** - User notifications
- user_id, title, message, type
- created_at, read_at

### Database Functions
- `get_leaderboard(challenge_id_param)` - Returns challenge leaderboard
- `match_documents()` - Vector search for documents

## Security Best Practices

### Environment Variables
- ✅ All sensitive credentials are stored in `.env` file
- ✅ `.env` is listed in `.gitignore`
- ✅ `.env.example` provides a template without real values
- ✅ Application validates required environment variables on startup

### Supabase Security
- Enable Row Level Security (RLS) policies on all tables
- Use the anon/public key only for client-side code
- Store the service role key securely (never expose to frontend)
- Configure storage bucket policies
- Set up proper user roles and permissions

### Best Practices
- Never commit `.env` files to git
- Rotate keys immediately if exposed
- Use different keys for development/staging/production
- Remove debug/test components before production deployment
- Remove console.log statements from production code
- Enable HTTPS in production
- Implement rate limiting for authentication endpoints
- Regularly audit dependencies for vulnerabilities

### Code Security
- Input validation with Zod schemas
- XSS protection via React's built-in escaping
- CSRF protection via Supabase Auth
- Secure file uploads with type/size validation

## Development

### Adding New Features

1. **Create components** in `src/components/`
2. **Add routes** in `src/App.tsx`
3. **Define database types** in `src/integrations/supabase/types.ts`
4. **Use TanStack Query** for data fetching
5. **Follow TypeScript** best practices

### Editing via Lovable

This project was initially created with [Lovable](https://lovable.dev).

- Visit your [Lovable Project](https://lovable.dev/projects/b2ca41b5-09f1-45f8-a86f-6a0ec545624d)
- Start prompting to make changes
- Changes are automatically committed to this repo

### Local Development

Use your preferred IDE:
- VS Code (recommended)
- WebStorm
- GitHub Codespaces

### Code Style
- Use ESLint for linting
- Follow React best practices
- Use TypeScript for type safety
- Keep components small and focused
- Write descriptive variable names

## Deployment

### Option 1: Lovable Hosting

1. Open your [Lovable Project](https://lovable.dev/projects/b2ca41b5-09f1-45f8-a86f-6a0ec545624d)
2. Click **Share** → **Publish**
3. Your app will be deployed automatically

### Option 2: Manual Deployment

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

**Docker:**
```bash
docker build -t builder-skill-showcase .
docker run -p 8080:8080 builder-skill-showcase
```

### Environment Variables in Production

Make sure to set environment variables in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment
- Docker: Use `.env` file or pass via `-e` flag

### Custom Domain

To connect a custom domain with Lovable:
1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow the DNS configuration steps

[Learn more about custom domains](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Guidelines
- Use clear, descriptive commit messages
- Follow conventional commits format
- Reference issue numbers when applicable

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For questions or issues:
- Open an issue on GitHub
- Check the [Lovable Documentation](https://docs.lovable.dev)
- Contact the maintainers

## Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn-ui](https://ui.shadcn.com)
- Backend by [Supabase](https://supabase.com)
- Icons from [Lucide](https://lucide.dev)

---

**Made with ❤️ using Lovable and Supabase**
