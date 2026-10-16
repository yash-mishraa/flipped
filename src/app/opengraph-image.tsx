import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export async function generateImageMetadata() {
  return [
    {
      id: "v2",
      size,
      contentType,
      alt: "FLIPPED — Word Deduction Puzzle",
    },
  ];
}

export default async function Image(): Promise<ImageResponse> {
  const [newsreaderBold, newsreaderSemiBold] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "src/assets/fonts/Newsreader-Bold.ttf")),
    fs.readFile(path.join(process.cwd(), "src/assets/fonts/Newsreader-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#7B1E2B",
          color: "#F7F0E5",
          fontFamily: "Newsreader, Georgia, serif",
          position: "relative",
          padding: "40px",
        }}
      >
        {/* Brand Symbol SVG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
          }}
        >
          <svg
            width="108"
            height="108"
            viewBox="0 0 64 64"
            fill="none"
          >
            <path
              d="M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z M 24 24 L 56 24 L 40 40 L 24 40 Z"
              fill="#F7F0E5"
              fillRule="evenodd"
            />
          </svg>
        </div>

        {/* Brand Wordmark in Editorial Serif */}
        <div
          style={{
            fontFamily: "Newsreader",
            fontSize: "120px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            marginBottom: "16px",
            color: "#F7F0E5",
            lineHeight: 1,
          }}
        >
          FLIPPED
        </div>

        {/* Tagline in Editorial Serif */}
        <div
          style={{
            fontFamily: "Newsreader",
            fontSize: "32px",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C49A6C",
            lineHeight: 1.2,
          }}
        >
          Word Deduction Puzzle
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Newsreader",
          data: newsreaderBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "Newsreader",
          data: newsreaderSemiBold,
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
