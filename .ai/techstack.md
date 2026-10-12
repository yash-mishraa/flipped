# Flipped — Technology Stack Specification

This document details the chosen technologies, exact dependency versions, architectural responsibilities, development scripts, and configuration decisions.

---

## 1. Core Stack & Runtime

| Technology     | Version          | Purpose & Responsibility                                       |
| :------------- | :--------------- | :------------------------------------------------------------- |
| **Node.js**    | `v22.23.3` (LTS) | JavaScript runtime for development and tooling                 |
| **npm**        | `10.9.9`         | Deterministic dependency and package management                |
| **Next.js**    | `^15.2.1`        | React framework with App Router, SSR, and API Route Handlers   |
| **React**      | `^19.0.0`        | Declarative UI component library                               |
| **React DOM**  | `^19.0.0`        | DOM bindings for React                                         |
| **TypeScript** | `^5.7.3`         | Static typing and language analysis with strict compiler flags |

---

## 2. Styling & Design

| Library / Tool           | Version   | Purpose & Responsibility                                       |
| :----------------------- | :-------- | :------------------------------------------------------------- |
| **Tailwind CSS**         | `^4.0.9`  | Utility-first styling engine with `@theme` token configuration |
| **@tailwindcss/postcss** | `^4.0.9`  | PostCSS integration for Tailwind CSS v4                        |
| **PostCSS**              | `^8.5.3`  | CSS transformation pipeline                                    |
| **Lucide React**         | `^1.16.0` | Lightweight, consistent SVG icon set                           |

### Theme Palette Tokens

- **Background Primary**: `#fcfbf9` (warm off-white paper canvas)
- **Text Charcoal**: `#24272c` (deep, readable contrast)
- **Accent Coral**: `#e26d5c` (base) / `#cc5442` (active) / `#fff4f0` (tint/badge)

---

## 3. Code Quality & Formatting

| Tool                   | Version   | Purpose & Responsibility                                        |
| :--------------------- | :-------- | :-------------------------------------------------------------- |
| **ESLint**             | `^9.21.0` | Static analysis with `eslint-config-next` and flat config       |
| **eslint-config-next** | `^15.2.1` | Next.js core web vitals and TypeScript linting rules            |
| **Prettier**           | `^3.5.2`  | Deterministic code formatting across TS, TSX, CSS, JSON, and MD |

---

## 4. Testing Frameworks

| Tool                          | Version   | Purpose & Responsibility                               |
| :---------------------------- | :-------- | :----------------------------------------------------- |
| **Vitest**                    | `^3.0.7`  | Blazing-fast Vite-native unit testing runner           |
| **@testing-library/react**    | `^16.2.0` | React component testing utilities                      |
| **@testing-library/jest-dom** | `^6.6.3`  | Custom DOM matchers for assertion ergonomics           |
| **jsdom**                     | `^26.0.0` | In-memory DOM implementation for headless unit testing |
| **Playwright**                | `^1.50.1` | Cross-browser end-to-end automation framework          |

---

## 5. Development Commands

| Command                  | Action                                                       | Suitable Environments       |
| :----------------------- | :----------------------------------------------------------- | :-------------------------- |
| `npm run dev`            | Starts Next.js development server on `http://localhost:3000` | Local development           |
| `npm run build`          | Compiles production-optimized Next.js bundle                 | CI / Production deployment  |
| `npm run start`          | Serves the compiled production build                         | Production runtime          |
| `npm run lint`           | Runs ESLint analysis across all project files                | Local & CI                  |
| `npm run typecheck`      | Executes TypeScript compiler (`tsc --noEmit`)                | Local & CI                  |
| `npm run test`           | Runs all Vitest unit tests deterministically once            | Local & CI                  |
| `npm run test:watch`     | Starts Vitest in interactive watch mode                      | Local development           |
| `npm run format:check`   | Verifies formatting compliance with Prettier                 | Local & CI                  |
| `npm run format`         | Automatically formats files with Prettier                    | Local development           |
| `npx prisma generate`    | Generates Prisma Client types from `schema.prisma`           | Local & CI                  |
| `npx prisma migrate dev` | Applies PostgreSQL database migrations                       | Local development           |
| `npx prisma db seed`     | Seeds curated puzzle bank and calendar assignments           | Local development & Staging |

---

## 6. TypeScript Compiler Flags

Configured in `tsconfig.json`:

- `strict: true` — enables all strict type-checking options.
- `noUncheckedIndexedAccess: true` — prevents unsafe array/record index access.
- `noImplicitOverride: true` — forces explicit override declarations.
- `noFallthroughCasesInSwitch: true` — prevents unhandled fallthrough bugs.
- `forceConsistentCasingInFileNames: true` — ensures cross-platform filesystem consistency.
- `paths: { "@/*": ["./src/*"] }` — clean absolute imports from `src/`.

---

## 7. Engine Dependency Integrity (Part 2)

- **Zero External Dependencies**: The entire core puzzle engine (`src/features/game/domain/`) is implemented in pure, vanilla TypeScript with zero external runtime libraries.
- **Framework Independence**: No React hooks, Next.js server components, browser globals, or DOM methods are imported in the domain logic.
- **Future Testability**: Engine modules are testable with 100% determinism in any standard JavaScript/TypeScript environment.

---

## 8. Backend, Database & Validation (Part 6)

| Technology / Library | Version    | Purpose & Responsibility                                          |
| :------------------- | :--------- | :---------------------------------------------------------------- |
| **Prisma ORM**       | `^6.19.3`  | Next-generation type-safe ORM for PostgreSQL schema & migrations  |
| **@prisma/client**   | `^6.19.3`  | Generated type-safe database query client                         |
| **Zod**              | `^4.6.6`   | Runtime request body and environment schema validation            |
| **PostgreSQL**       | `16` (DDL) | Relational database engine for puzzles, attempts & guest profiles |
| **Node Crypto**      | Built-in   | Cryptographic HMAC-SHA256 signatures for guest session cookies    |

### Environment Configuration

Documented in `.env.example`:

| Variable               | Default / Example                     | Description                                                    |
| :--------------------- | :------------------------------------ | :------------------------------------------------------------- |
| `DATABASE_URL`         | `postgresql://postgres:postgres@...`  | PostgreSQL connection string. When unset, memory store is used |
| `GUEST_SESSION_SECRET` | `development-guest-secret-key-at-...` | HMAC-SHA256 secret key for signing guest cookies               |
| `APP_TIMEZONE`         | `Asia/Kolkata`                        | Authoritative game clock reference timezone                    |
