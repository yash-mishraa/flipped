# FLIPPED — The Editorial Word Deduction Puzzle

[![Production Build](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Domain](https://img.shields.io/badge/Live-flipped.website-crimson?style=flat)](https://flipped.website)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A high-polish, production-grade word deduction puzzle game built with **Next.js 15 App Router**, **React 19**, **TypeScript strict mode**, **Tailwind CSS v4**, **Clerk Core Authentication**, and **Prisma ORM**.

In **FLIPPED**, players decode two transformed clue words (via antonyms or synonyms) to uncover a familiar compound word or two-word phrase within a 60-second countdown timer.

---

## Live Domain & Deployment

- **Production URL**: [https://flipped.website](https://flipped.website)
- **Vercel Preview**: [https://flipped-sepia.vercel.app](https://flipped-sepia.vercel.app)
- **Developer Contact**: [flippedbyyash@gmail.com](mailto:flippedbyyash@gmail.com)

---

## Origins & Attribution

**FLIPPED** was inspired by the word deduction puzzle titled &ldquo;Flipped It&rdquo; originally featured in the print edition of the **Times of India (TOI)** newspaper. 

Because the original game was restricted exclusively behind physical, home-delivered newspaper subscriptions in India with no digital access, **FLIPPED** was engineered from the ground up as an **open-access, 100% free digital web application** for word enthusiasts globally.

### Key Innovations Over the Print Edition:
- **Worldwide Web-First Access**: Zero subscriptions, paywalls, or app store downloads required. Playable on every mobile phone, tablet, and desktop browser.
- **Classic Practice Sprints**: An unlimited practice mode with `Easy`, `Medium`, and `Hard` difficulty tiers and timed sprint options (1m, 2m, 3m, 5m) so players don't have to wait 24 hours between puzzles.
- **Authoritative Daily Challenge**: Global UTC midnight synchronization so players in India, the Americas, Europe, and Asia all play the exact same puzzle on the same day.
- **60-Second Real-Time Countdown**: Interactive adrenaline-pumping deductions with penalty-deducting hint assistance.
- **Letter-by-Letter Real-Time Grid**: Tile input states (`fixed`, `entered`, `confirmed`) with auto-advancing cursor and backspace navigation.
- **Cloud Sync & Guest Isolation**: Complete dual-track progress persistence—guests keep their daily streaks safely in browser `localStorage`, while signing in with Clerk enables multi-device cloud synchronization.
- **Complete Historical Archive**: Browse and replay past daily challenges anytime without altering official daily streak statistics.

---

## GoDaddy Custom Domain Setup (`flipped.website`)

Follow these exact steps to configure your custom domain bought through GoDaddy:

### 1. Add Domain in Vercel
1. Go to your project on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Navigate to **Settings** &rarr; **Domains**.
3. Add `flipped.website` and select the recommended redirect (redirect `www.flipped.website` to `flipped.website` or vice-versa).

### 2. Configure DNS Records in GoDaddy
1. Log into your [GoDaddy Domain Portfolio](https://dcc.godaddy.com/manage/portfolio).
2. Click on **`flipped.website`** and navigate to the **DNS** management tab.
3. Add or update the following DNS records:

| Type | Name / Host | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | `600 seconds` (or 1/2 hour) |
| **CNAME** | `www` | `cname.vercel-dns.com.` | `1 hour` (or 3600s) |

> [!NOTE]
> If GoDaddy has default parking `A` records (pointing to parked IPs like `34.102.136.180`), edit or delete them so that only the Vercel `76.76.21.21` record remains for `@`.

### 3. Automatic SSL Certification
- Vercel will automatically detect the DNS configuration, verify domain ownership, and provision a free, auto-renewing Let's Encrypt Wildcard SSL certificate within 5–15 minutes.
- Once configured, [https://flipped.website](https://flipped.website) will be live with HTTPS enforced.

---

## Google Search Indexing & SEO Setup

FLIPPED includes a complete technical SEO foundation out of the box:

### Included SEO Features
- **Dynamic Sitemap (`/sitemap.xml`)**: Maps all canonical pages (`/`, `/daily`, `/classic`, `/archive`, `/stats`, `/about`, `/contact`, `/privacy`, `/terms`) with updated priorities and change frequencies.
- **Crawler Directives (`/robots.txt`)**: Allows search bots (`Googlebot`, `bingbot`) while shielding private authentication and API endpoints.
- **Social Graph Previews (`/opengraph-image`)**: Dynamically rendered 1200x630 OpenGraph and Twitter cards featuring official brand vectors and taglines.
- **JSON-LD Structured Data**: Embedded `WebSite`, `WebApplication`, and `VideoGame` Schema.org graphs enabling rich search snippets and carousel inclusion.
- **Canonical URLs**: Every page contains `rel="canonical"` linking strictly to `https://flipped.website/*`.

### Step-by-Step Google Search Console Indexing
1. **Open Google Search Console**: Visit [https://search.google.com/search-console](https://search.google.com/search-console).
2. **Add Property**:
   - Choose **Domain** property and enter `flipped.website`.
   - Copy the verification `TXT` record provided by Google (e.g., `google-site-verification=...`).
3. **Add TXT Record in GoDaddy**:
   - In GoDaddy DNS Management for `flipped.website`, add:
     - **Type**: `TXT`
     - **Name**: `@`
     - **Value**: `google-site-verification=...`
     - **TTL**: `1 hour`
   - Alternatively, add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-code"` in Vercel environment variables.
4. **Verify in Google Search Console**: Click **Verify**.
5. **Submit Sitemap**:
   - In the left sidebar, click **Sitemaps**.
   - Under *Add a new sitemap*, enter: `sitemap.xml` and click **Submit**.
   - Status should change to **Success** within a few hours.
6. **Request Priority Indexing**:
   - Paste `https://flipped.website` into the top URL Inspection bar.
   - Click **Request Indexing** to schedule Googlebot for a priority crawl. Repeat for `/daily` and `/about`.

---

## Site Pages & Navigation

- **[`/`](file:///Users/yashmishra14/Flippedit/src/app/page.tsx)**: Production homepage with brand wordmark, Wordle-style daily streak indicator, quick actions, and tutorial launcher.
- **[`/daily`](file:///Users/yashmishra14/Flippedit/src/app/daily/page.tsx)**: Authoritative Daily Challenge with single-attempt locking, countdown timer, hints, and victory review.
- **[`/classic`](file:///Users/yashmishra14/Flippedit/src/app/classic/page.tsx)**: Unlimited practice sprints across Easy, Medium, and Hard tiers.
- **[`/archive`](file:///Users/yashmishra14/Flippedit/src/app/archive/page.tsx)**: Historical calendar of past daily challenges playable on demand.
- **[`/stats`](file:///Users/yashmishra14/Flippedit/src/app/stats/page.tsx)**: Player dashboard tracking games played, win rate, solve times, and cloud synchronization.
- **[`/about`](file:///Users/yashmishra14/Flippedit/src/app/about/page.tsx)**: Story, Times of India attribution, deduction mechanics, and feature comparisons.
- **[`/contact`](file:///Users/yashmishra14/Flippedit/src/app/contact/page.tsx)**: Interactive Mailbox component connecting directly to `flippedbyyash@gmail.com`.
- **[`/privacy`](file:///Users/yashmishra14/Flippedit/src/app/privacy/page.tsx)**: Transparent GDPR/CCPA privacy policy detailing local storage and cloud sync.
- **[`/terms`](file:///Users/yashmishra14/Flippedit/src/app/terms/page.tsx)**: Terms of service, fair play rules, and intellectual property notices.

---

## Security & Architecture

1. **Zero Client Solution Leakage**: Master solutions and acceptable synonyms exist exclusively in server-side repositories (`src/server/puzzles/puzzle-repository.ts`). Client bundles receive only sanitized puzzle metadata.
2. **Server-Authoritative Evaluation**: All daily challenge submissions and timeouts are validated server-side against an authoritative start timestamp.
3. **Cryptographically Signed Guest Sessions**: Guests receive HMAC-SHA256 signed session tokens stored in `HttpOnly`, `SameSite=Lax` cookies to prevent spoofing.
4. **Relational Database with Zero-Config Fallback**: Built with Prisma ORM and PostgreSQL, paired with a reliable in-memory database fallback (`InMemoryDatabase`) for local development and CI testing.

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

# Google Search Console Verification (Optional)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-verification-code"

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
- **Website**: [flipped.website](https://flipped.website)
