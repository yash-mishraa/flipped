import React from "react";
import type { Metadata } from "next";
import { SignUp, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";

export const metadata: Metadata = {
  title: "Create Free Account | FLIPPED",
  description: "Create a free account on FLIPPED to save your word deduction puzzle streaks and progress.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl items-center justify-center p-6">
        <ClerkLoading>
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border border-[#C49A6C]/50 bg-white/90 shadow-md">
            <FlippedSymbol size={40} variant="crimson" />
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7B1E2B] border-t-transparent" />
            <p className="text-xs font-bold text-[#6B4E55] tracking-wide">
              Loading Secure Account Creation...
            </p>
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <SignUp
            path="/sign-up"
            routing="path"
            fallbackRedirectUrl="/"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                card: "border border-[#C49A6C]/40 shadow-md rounded-2xl bg-white",
                headerTitle: "text-[#32171D] font-black",
                headerSubtitle: "text-[#6B4E55]",
                formButtonPrimary: "bg-[#7B1E2B] hover:bg-[#631722] text-[#F7F0E5]",
                footerActionLink: "text-[#7B1E2B] hover:underline",
              },
            }}
          />
        </ClerkLoaded>
      </main>
      <Footer />
    </div>
  );
}
