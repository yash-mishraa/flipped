import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import React from "react";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#7B1E2B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.flipped.website"),
  title: {
    default: "FLIPPED — Word Deduction Puzzle",
    template: "%s | FLIPPED",
  },
  description:
    "Flip the meanings of two clue words to uncover a familiar phrase before your 60-second timer runs out. Free daily word puzzle, classic practice sprints, and challenge archive.",
  applicationName: "FLIPPED",
  authors: [{ name: "Yash Mishra", url: "https://www.flipped.website" }],
  creator: "Yash Mishra",
  publisher: "FLIPPED",
  keywords: [
    "flipped",
    "flipped game",
    "flipped word game",
    "word deduction puzzle",
    "daily word game",
    "times of india flipped it",
    "word puzzle online",
    "free word game",
    "wordle alternative",
    "brain teaser",
    "phrase guessing puzzle",
    "daily puzzle",
  ],
  alternates: {
    canonical: "https://www.flipped.website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "FLIPPED — Word Deduction Puzzle",
    description:
      "Flip the meanings of two clue words to uncover a familiar phrase before your 60-second timer runs out. Play free daily challenges and classic sprints.",
    url: "https://www.flipped.website",
    siteName: "FLIPPED",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FLIPPED — Word Deduction Puzzle",
    description:
      "Flip the meanings of two clue words to uncover a familiar phrase before your 60-second timer runs out. Free daily challenge and classic sprints.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.flipped.website/#website",
      url: "https://www.flipped.website",
      name: "FLIPPED",
      description: "Flip the meanings of two clue words to uncover a familiar phrase.",
      inLanguage: "en-US",
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.flipped.website/#game",
      url: "https://www.flipped.website",
      name: "FLIPPED — Word Deduction Puzzle",
      applicationCategory: "GameApplication",
      genre: ["Word Game", "Puzzle Game", "Brain Teaser"],
      operatingSystem: "All",
      browserRequirements: "Requires modern JavaScript-enabled web browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: "Yash Mishra",
        email: "flippedbyyash@gmail.com",
      },
      description:
        "An engaging daily word deduction puzzle where players flip opposites/synonyms of two clue words to uncover a familiar phrase within 60 seconds.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  let publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    publishableKey = "pk_test_c2FmZS1jYXQtMjI1OC5jbGVyay5hY2NvdW50cy5kZXYk";
  } else if (publishableKey.includes("Y2xlcmsuZmxpcHBlZC1zZXBpYS52ZXJjZWwuYXBwJA")) {
    publishableKey = "pk_live_Y2xlcmsuZmxpcHBlZC53ZWJzaXRlJA";
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body className="min-h-screen bg-[#F7F0E5] text-[#32171D] antialiased selection:bg-[#7B1E2B] selection:text-[#F7F0E5]">
        <ClerkProvider
          publishableKey={publishableKey}
          appearance={
            {
              layout: {
                unsafe_disableDevelopmentModeWarnings: true,
              },
            } as Record<string, unknown>
          }
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
