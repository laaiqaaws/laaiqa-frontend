# Laaiqa Frontend

Next.js 14 web application for the Laaiqa artist booking platform.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication pages
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup & role selection
│   │   ├── admin-login/    # Admin login
│   │   └── callback/       # OAuth callback
│   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── artist/         # Artist dashboard
│   │   ├── customer/       # Customer dashboard
│   │   └── profile/        # Profile settings
│   ├── quote/[id]/         # Quote detail page
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/
│   ├── bookings/           # Booking-related components
│   ├── icons/              # Custom icons
│   ├── seo/                # SEO components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth-context.tsx    # Authentication context
│   ├── config.ts           # App configuration
│   ├── validation.ts       # Form validation
│   └── utils.ts            # Utility functions
└── types/
    └── user.ts             # TypeScript types
```

## Features

### Authentication
- Google OAuth integration
- Role-based access (Artist/Customer/Admin)
- Protected routes with middleware
- Session management

### Artist Dashboard
- Create and manage quotes
- Calendar view for bookings
- Analytics and revenue tracking
- Wallet and withdrawals

### Customer Dashboard
- View and accept quotes
- Booking history
- Reviews and disputes

### Admin Dashboard
- User management
- Quote oversight
- Dispute resolution
- Withdrawal processing

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Styling

- Tailwind CSS for utility-first styling
- shadcn/ui for accessible components
- Custom brand colors defined in `globals.css`
- Dark theme by default

## Deployment

Optimized for Vercel deployment:

```bash
# Build and deploy
vercel --prod
```

Or build locally:

```bash
npm run build
npm start
```
