import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "FLIPPED — Word Deduction Puzzle";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

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
        {/* Subtle decorative gold border frame */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            width: "1152px",
            height: "582px",
            border: "2px solid #C49A6C",
            borderRadius: "20px",
          }}
        />

        {/* Brand Symbol SVG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <svg
            width="88"
            height="88"
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
            fontSize: "104px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            marginBottom: "10px",
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
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C49A6C",
            marginBottom: "28px",
            lineHeight: 1.2,
          }}
        >
          Word Deduction Puzzle
        </div>

        {/* Decorative divider rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "1px",
              backgroundColor: "#C49A6C",
            }}
          />
          <div
            style={{
              width: "7px",
              height: "7px",
              backgroundColor: "#C49A6C",
              transform: "rotate(45deg)",
            }}
          />
          <div
            style={{
              width: "80px",
              height: "1px",
              backgroundColor: "#C49A6C",
            }}
          />
        </div>

        {/* Feature Pills — authentic cream & wine game tiles with gold border */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              backgroundColor: "#F7F0E5",
              border: "2px solid #C49A6C",
              borderRadius: "9999px",
              padding: "14px 30px",
              fontSize: "21px",
              fontWeight: 700,
              color: "#32171D",
              fontFamily: "Newsreader, Georgia, serif",
              boxShadow: "0 6px 18px rgba(50, 23, 29, 0.4)",
            }}
          >
            Daily 60s Challenge
          </div>
          <div
            style={{
              backgroundColor: "#F7F0E5",
              border: "2px solid #C49A6C",
              borderRadius: "9999px",
              padding: "14px 30px",
              fontSize: "21px",
              fontWeight: 700,
              color: "#32171D",
              fontFamily: "Newsreader, Georgia, serif",
              boxShadow: "0 6px 18px rgba(50, 23, 29, 0.4)",
            }}
          >
            Classic Practice Sprints
          </div>
          <div
            style={{
              backgroundColor: "#32171D",
              border: "2px solid #C49A6C",
              borderRadius: "9999px",
              padding: "14px 30px",
              fontSize: "21px",
              fontWeight: 700,
              color: "#F7F0E5",
              fontFamily: "Newsreader, Georgia, serif",
              boxShadow: "0 6px 18px rgba(50, 23, 29, 0.4)",
            }}
          >
            flipped.website
          </div>
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
