import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FLIPPED — Word Deduction Puzzle";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image(): Promise<ImageResponse> {
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
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          padding: "60px",
        }}
      >
        {/* Subtle decorative border */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: "2px solid rgba(196, 154, 108, 0.4)",
            borderRadius: "28px",
          }}
        />

        {/* Brand Symbol SVG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <svg
            width="100"
            height="100"
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

        {/* Brand Wordmark */}
        <div
          style={{
            fontSize: "84px",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            marginBottom: "12px",
            color: "#F7F0E5",
          }}
        >
          FLIPPED
        </div>

        {/* Subtitle / Tagline */}
        <div
          style={{
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#C49A6C",
            marginBottom: "28px",
          }}
        >
          Word Deduction Puzzle
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(247, 240, 229, 0.15)",
              border: "1px solid rgba(196, 154, 108, 0.5)",
              borderRadius: "9999px",
              padding: "8px 24px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#F7F0E5",
            }}
          >
            Daily 60s Challenge
          </div>
          <div
            style={{
              backgroundColor: "rgba(247, 240, 229, 0.15)",
              border: "1px solid rgba(196, 154, 108, 0.5)",
              borderRadius: "9999px",
              padding: "8px 24px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#F7F0E5",
            }}
          >
            Classic Practice Sprints
          </div>
          <div
            style={{
              backgroundColor: "rgba(247, 240, 229, 0.15)",
              border: "1px solid rgba(196, 154, 108, 0.5)",
              borderRadius: "9999px",
              padding: "8px 24px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#F7F0E5",
            }}
          >
            flipped.website
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
