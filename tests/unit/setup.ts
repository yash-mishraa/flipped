import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) => {
    if (when === "signed-out") return children;
    return null;
  },
  SignedIn: () => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => React.createElement("div", { "data-testid": "user-button" }),
  useUser: () => ({ isSignedIn: false, user: null, isLoaded: true }),
  useAuth: () => ({ isSignedIn: false, userId: null, isLoaded: true }),
  clerkMiddleware: () => () => {},
}));
