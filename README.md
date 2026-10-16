# FLIPPED — The Editorial Word Deduction Puzzle

[![Production Build](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Domain](https://img.shields.io/badge/Live-flipped.website-crimson?style=flat)](https://www.flipped.website)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A high-polish, production-grade word deduction puzzle game built with **Next.js 15 App Router**, **React 19**, **TypeScript strict mode**, **Tailwind CSS v4**, **Clerk Core Authentication**, and **Prisma ORM**.

In **FLIPPED**, players decode two transformed clue words (via antonyms or semantic flips) to uncover a familiar compound word or two-word phrase within a 60-second countdown timer.

---

## Live Application

- **Production Website**: [https://www.flipped.website](https://www.flipped.website)
- **Developer Mailbox**: [flippedbyyash@gmail.com](mailto:flippedbyyash@gmail.com)

---

## Origins & Attribution

**FLIPPED** was inspired by the word deduction puzzle titled &ldquo;Flipped It&rdquo; originally featured in the print edition of the **Times of India (TOI)** newspaper.

Because the original game was restricted exclusively behind physical, home-delivered newspaper subscriptions in India with no digital access, **FLIPPED** was engineered from the ground up as an **open-access, 100% free digital web application** for word enthusiasts globally.

### Key Innovations Over the Print Edition:

- **Worldwide Web-First Access**: Zero subscriptions, paywalls, or app store downloads required. Playable on every mobile phone, tablet, and desktop browser.
- **Classic Practice Sprints**: An unlimited practice mode with `Easy`, `Medium`, and `Hard` difficulty tiers and timed sprint options (1m, 2m, 3m, 5m) so players don't have to wait 24 hours between puzzles.
- **Authoritative Daily Challenge**: Global UTC midnight synchronization so players around the world all play the exact same puzzle on the same day.
- **60-Second Real-Time Countdown**: Interactive deductions with penalty-deducting hint assistance.
- **Letter-by-Letter Real-Time Grid**: Tile input states (`fixed`, `entered`, `confirmed`) with auto-advancing cursor and backspace navigation.
- **Cloud Sync & Guest Isolation**: Complete dual-track progress persistence—guests keep their daily streaks safely in browser `localStorage`, while signing in with Clerk enables multi-device cloud synchronization.
- **Complete Historical Archive**: Browse and replay past daily challenges anytime without altering official daily streak statistics.

---

## Game Modes & Features

- **Daily Challenge (`/daily`)**: The flagship daily puzzle reset every midnight UTC. Features single-attempt locking, countdown timer, hints, and victory review.
- **Classic Mode (`/classic`)**: Unlimited practice sprints with custom timers and difficulty tiers (Easy, Medium, Hard).
- **Challenge Archive (`/archive`)**: Historical calendar of all past daily challenges playable on demand.
- **Player Statistics (`/stats`)**: Personal performance dashboard tracking games played, win rate, current/max streaks, and solve time distributions.
- **About FLIPPED (`/about`)**: The origins story, Times of India attribution, and breakdown of deduction mechanics.
- **Contact & Feedback (`/contact`)**: Direct developer communication channel and FAQ.

---

## Security & Architecture

1. **Zero Client Solution Leakage**: Master solutions and acceptable synonyms exist exclusively in server-side repositories (`src/server/puzzles/puzzle-repository.ts`). Client bundles receive only sanitized puzzle metadata.
2. **Server-Authoritative Evaluation**: All daily challenge submissions and timeouts are validated server-side against an authoritative start timestamp.
3. **Cryptographically Signed Guest Sessions**: Guests receive HMAC-SHA256 signed session tokens stored in `HttpOnly`, `SameSite=Lax` cookies to prevent spoofing.
4. **Relational Database with Zero-Config Fallback**: Built with Prisma ORM and PostgreSQL, paired with a reliable in-memory database fallback (`InMemoryDatabase`) for local development and CI testing.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/), [Playwright](https://playwright.dev/)

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

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file in the project root:

```env
# Optional: PostgreSQL connection string (falls back to in-memory store if unset)
DATABASE_URL="postgresql://user:password@localhost:5432/flipped_db?schema=public"

# Secret key for HMAC-SHA256 guest session cookies (32+ chars)
GUEST_SESSION_SECRET="your-secure-random-secret-at-least-32-chars-long"

# Clerk Authentication Keys (Optional for local dev, defaults to sandbox)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Node environment
NODE_ENV="development"
```

---

## Verification & Testing Suite

FLIPPED contains comprehensive unit, component, security, and Playwright end-to-end browser tests:

```bash
# Run all unit and integration tests (291 tests across 41 suites)
npm test

# Check TypeScript types
npm run typecheck

# Check ESLint rules
npm run lint

# Production build compilation
npm run build

# Run Playwright End-to-End browser journeys
npx playwright test
```

---

## License & Contact

- **License**: MIT
- **Creator**: Yash Mishra
- **Mailbox**: [flippedbyyash@gmail.com](mailto:flippedbyyash@gmail.com)
- **Website**: [flipped.website](https://www.flipped.website)
