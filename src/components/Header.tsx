"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import BreadcrumbNavigation from "@/components/ui/breadcrumb";

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  React.useEffect(() => {
    const saved = window.localStorage.getItem("flipped-theme");
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("flipped-theme", next);
  };

  return (
    <>
      <header className="sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-3 sm:px-6">
          <BreadcrumbNavigation
            pathname={pathname}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenInstructions={() => setTutorialOpen(true)}
          />
        </div>
      </header>

      {/* Global Interactive Tutorial Modal */}
      <TutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  );
}
