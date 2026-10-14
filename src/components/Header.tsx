"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import BreadcrumbNavigation from "@/components/ui/breadcrumb";

export function Header(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[#F7F0E5]/90 backdrop-blur-md border-b border-[#C49A6C]/20">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-6">
        <BreadcrumbNavigation pathname={pathname} />

        <div className="flex shrink-0 items-center gap-2 pl-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex items-center rounded-xl border border-[#C49A6C]/70 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#32171D] shadow-xs hover:bg-[#faeee0] hover:border-[#7B1E2B] transition active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7 border border-[#C49A6C]",
                },
              }}
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
