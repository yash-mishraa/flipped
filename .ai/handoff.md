# Flipped — Session Handoff (Part 6 -> Part 7)

## 1. What Exists Today

- **Database Layer & Migrations (`prisma/`, `src/server/db/`)**:
  - `prisma/schema.prisma`: Normalized PostgreSQL schema with `Puzzle`, `DailyAssignment`, `GuestProfile`, and `GameAttempt` models. Enforces `@@unique([guestId, dailyDate])` for Daily attempt locking.
  - `prisma/migrations/20261012000000_init/migration.sql`: Reproducible PostgreSQL DDL with enums, tables, foreign keys, unique constraints, and indexes.
  - `prisma/seed.ts`: Repeatable seed script upserting 12 curated puzzles and published schedule without duplication.
  - `src/server/db/client.ts`: Singleton `PrismaClient` with `InMemoryDatabase` fallback ensuring 100% testability and offline build resilience when `DATABASE_URL` is unconfigured.

- **Security & Guest Identity (`src/server/auth/`, `src/server/utils/`)**:
  - `src/server/auth/guest-session.ts`: Cryptographically signed guest tokens (`guestId.timestamp.hmac`), constant-time verification, and `HttpOnly`, `SameSite=Lax`, `Secure` cookie directives.
  - `src/server/utils/rate-limit.ts`: In-memory sliding-window rate limiter protecting submission endpoints against brute-force attacks.

- **Server-Authoritative Game Engine & Security (`src/server/game/`, `src/server/puzzles/`, `src/server/scheduling/`)**:
  - `src/server/puzzles/puzzle-repository.ts`: `createSafeGameplayPayload` (strictly omits canonical answers, variants, and transformation answers) and `createFinalizedResultPayload` (reveals answers only after `WON` or `TIMED_OUT`).
  - `src/server/game/attempt-service.ts`: Authoritative attempt lifecycle managing start, resumption, atomic deadline enforcement, authoritative scoring via `calculateScore`, win/timeout finalization, and idempotent submissions.
  - `src/server/game/hint-service.ts`: Authoritative hint service validating active deadline and returning only the single authorized letter and position with 5-point deduction.
  - `src/server/scheduling/daily-scheduler.ts`: Deterministic date resolution in `Asia/Kolkata` and assignment resolution.

- **Next.js App Router API Routes (`src/app/api/`)**:
  - `/api/health`: Health status and database mode.
  - `/api/game/daily/start`: Initiates or resumes daily attempt with guest cookie.
  - `/api/game/classic/start`: Initiates classic round with Zod validation.
  - `/api/game/attempt/[id]/submit`: Validates candidate phrase and finalizes round.
  - `/api/game/attempt/[id]/timeout`: Finalizes expired attempts.
  - `/api/game/attempt/[id]/hint`: Authoritative hint dispatch.
  - `/api/game/attempt/[id]`: Returns finalized result (HTTP 403 while active).
  - `/api/game/daily/status`: Returns current daily challenge status.

- **Frontend Server Integration (`src/features/game/components/ServerGameBoard.tsx`)**:
  - Communicates directly with server API routes; zero solution leakage to browser.
  - Integrated into `/daily` and `/classic` routes.

- **Verification Metrics**:
  - **172 / 172 unit and integration tests passing** across 23 test suites in ~1.8s (`npm run test`).
  - Zero TypeScript compiler errors (`npm run typecheck`).
  - Zero ESLint errors or warnings (`npm run lint`).
  - Clean Prettier formatting (`npm run format:check`).
  - Successful Next.js production build (`npm run build`) generating 8 static pages and 8 dynamic API routes.

---

## 2. What Part 7 Must Implement

In **Part 7 — Visual Polish, UI Redesign, Onboarding & User Experience**, the engineer will build:

1. **Visual Redesign & Tactile Physicality**:
   - Refine letter tile aesthetics with bespoke physical feel (smooth 3D flips, paper texture, subtle shadows).
   - High-fidelity typography, spacing, and micro-interactions.
   - Smooth state transitions for lock, reveal, pending, and eliminated states.

2. **First-Time User Onboarding & Interactive Tutorial**:
   - Guided interactive tutorial / modal explaining the Flipped game mechanics.
   - Demonstration of semantic clue transformations and letter-frequency rules.

3. **Responsive Design & Mobile Ergonomics**:
   - Touchscreen keyboard ergonomics, layout stability during virtual keyboard summon.
   - Viewport scaling and safe-area adjustments across phone and tablet screens.

4. **Audio & Haptic Feedback (Optional / Accessible)**:
   - Subtle acoustic cues for key presses, flips, hints, and victory (with toggle and `prefers-reduced-motion` compliance).
