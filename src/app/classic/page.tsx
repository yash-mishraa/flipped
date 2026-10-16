"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClassicSprintBoard } from "@/features/game/components/ClassicSprintBoard";

export default function ClassicPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col gap-3 sm:gap-4 px-3.5 py-4 sm:px-8 sm:py-6">
        {/* Interactive Sprint Board */}
        <section className="w-full flex-1 flex flex-col justify-center">
          <ClassicSprintBoard />
        </section>
      </main>
      <Footer />
    </div>
  );
}
