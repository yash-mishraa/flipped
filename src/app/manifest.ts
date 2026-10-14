import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FLIPPED — Word Deduction Puzzle",
    short_name: "FLIPPED",
    description: "Flip two clue words into a familiar phrase before the 60-second timer runs out.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F0E5",
    theme_color: "#7B1E2B",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
