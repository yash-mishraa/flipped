# Flipped — The Editorial Word Deduction Puzzle

A production-quality word puzzle game built with Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, and Prisma ORM.

In **Flipped**, players decode two transformed clue words (via antonyms or synonyms) to reveal a familiar compound word or two-word phrase within a 60-second countdown.

---

## Game Overview

- **Core Mechanic**: Two clue words are presented alongside their semantic transformation rules (`SYNONYM` or `ANTONYM`). Transforming each clue word and combining them forms a common two-word phrase (e.g., `COLD` [Antonym] + `WATER` [Synonym] → `HOT SPRING`).
- **Interactive Grid**: Keyboard and touch-responsive tile grid with automatic answer detection. The first letter of each answer word is provided as a fixed clue.
- **Scoring Engine**: Server-authoritative scoring starting at 100 points, decaying by 1 point every 5 seconds, with a 5-point deduction per hint used:
  $$\text{Score} = \max(0, \min(100, 100 - \lfloor\text{elapsedSeconds} / 5\rfloor - (\text{hintsUsed} \times 5)))$$
- **Game Modes**:
  - **Daily Challenge**: One authoritative daily puzzle released at midnight `Asia/Kolkata` (IST). Strictly enforced single-attempt lock per player with persistent result review.
  - **Classic Practice**: Unlimited practice across `Easy`, `Medium`, and `Hard` difficulty tiers with repetition-free selection.
- **Player Hub**:
  - **First-Time Onboarding**: Guided 3-step walkthrough with an interactive 4x4 practice sandbox (`SLOW` + `MEAL` → `FAST FOOD`).
  - **Spoiler-Free Sharing**: Native Web Share API with clipboard fallback emitting masked emoji block grids (`🟩🟩🟩🟩 🟩🟩🟩🟩`).
  - **Player Statistics**: Real-time streak tracking, win rates, and solve times across `Asia/Kolkata` calendar days.
  - **Archive**: Historical view of past published daily challenges.

---

## Security & Architecture

1. **Zero Client Bundle Leakage**:
   - Master solutions and approved variants are strictly isolated to server-side repositories (`src/server/puzzles/puzzle-repository.ts`).
   - Browser client bundles receive only safe metadata (`id`, `clueWords`, `difficulty`, `wordLengths`) via `public-puzzles.ts`.
   - Verified 0 occurrences of target answers or variants in `.next/static/` production bundles.
2. **Server-Authoritative Evaluation**:
   - Timers, attempt durations, and final scores are evaluated server-side against an authoritative 60-second deadline timestamp recorded in the database. Client claims are never trusted.
3. **Cryptographically Signed Guest Sessions**:
   - Players receive an HMAC-SHA256 signed token (`guestId.timestamp.hmac`) stored in an `HttpOnly`, `SameSite=Lax` cookie.
   - Timing-safe verification prevents impersonation or attempt tampering.
4. **Relational Database with Zero-Config Fallback**:
   - Production persistence powered by Prisma ORM and PostgreSQL (`prisma/schema.prisma`).
   - Transparent in-memory fallback adapter (`InMemoryDatabase`) allows local development and CI testing to execute seamlessly without a running database service.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **UI Library**: React 19, Lucide React icons
- **Styling**: Tailwind CSS v4, custom editorial design system (`#fcfbf9` warm paper, `#24272c` charcoal, `#e26d5c` coral)
- **Database & ORM**: PostgreSQL, Prisma ORM 6
- **Testing**:
  - Vitest 3 with `@testing-library/react` and `jsdom` (Unit & Integration)
  - Playwright (End-to-End browser journeys)
- **Tooling**: TypeScript 5 (strict), ESLint 9, Prettier 3

---

## Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yash-mishraa/flipped.git
cd flipped

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Optional: PostgreSQL connection string (falls back to in-memory store if unset)
DATABASE_URL="postgresql://user:password@localhost:5432/flipped_db?schema=public"

# Secret key for HMAC-SHA256 guest session cookies (32+ chars)
GUEST_SESSION_SECRET="your-secure-random-secret-at-least-32-chars-long"

# Node environment
NODE_ENV="development"
```

### Database Setup (Optional for PostgreSQL)

```bash
# Push schema to database
npx prisma db push

# Seed master puzzles and schedule
npx prisma db seed
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Verification

The project includes full unit, integration, security, and end-to-end test suites:

```bash
# Run all unit and integration tests (199 tests across 28 suites)
npm test

# Run unit tests in watch mode
npm run test:watch

# Run Playwright End-to-End tests (12 tests across 5 suites)
npx playwright test

# Check TypeScript types
npm run typecheck

# Check ESLint rules
npm run lint

# Check Prettier code formatting
npm run format:check

# Auto-format codebase
npm run format

# Production build compilation
npm run build
```

### End-to-End User Journeys (Playwright)

- **Journey A (`tests/e2e/first-time-and-classic.spec.ts`)**: First-time player walkthrough, onboarding completion, navigation to Classic practice.
- **Journey B (`tests/e2e/first-time-and-classic.spec.ts`)**: Letter entry, arrow key navigation, Backspace editing, auto-validation.
- **Journey C (`tests/e2e/hints-and-timeout.spec.ts`)**: Hint request, 5-point deduction, revealed tile locking.
- **Journey D (`tests/e2e/hints-and-timeout.spec.ts`)**: 60-second timeout, input locking, canonical solution reveal.
- **Journey E (`tests/e2e/daily-restrictions.spec.ts`)**: Daily challenge single-attempt lock and reload persistence.
- **Journey F (`tests/e2e/resilience-and-accessibility.spec.ts`)**: Responsive layouts across 320px, 390px, 768px, 1280px without horizontal overflow, keyboard roving tabindex, header routing.

---

## Production Deployment

### Option 1: Vercel

1. Connect the GitHub repository `https://github.com/yash-mishraa/flipped.git` in the Vercel dashboard.
2. Set environment variables:
   - `GUEST_SESSION_SECRET`: Generate a 32+ character random string.
   - `DATABASE_URL`: Add a managed PostgreSQL connection string (e.g. Vercel Postgres, Neon, Supabase).
3. Deploy. Vercel automatically runs `prisma generate` and `next build`.

### Option 2: Node.js Server / Docker

```bash
# Install production dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Build optimized Next.js bundle
npm run build

# Start production server
npm start
```

---

## License

MIT
