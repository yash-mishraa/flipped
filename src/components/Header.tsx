"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import BreadcrumbNavigation from "@/components/ui/breadcrumb";

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const [tutorialOpen, setTutorialOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-3 sm:px-6">
          <BreadcrumbNavigation
            pathname={pathname}
            onOpenInstructions={() => setTutorialOpen(true)}
          />
        </div>
      </header>

      {/* Global Interactive Tutorial Modal */}
      <TutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  );
}
