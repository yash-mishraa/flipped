"use client";

import React, { useEffect } from "react";

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps): React.JSX.Element {
  useEffect(() => {
    console.error("Global root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#F7F0E5",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: "#32171D",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            margin: "24px",
            backgroundColor: "#FFFFFF",
            border: "2px solid #C49A6C",
            borderRadius: "24px",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(50, 23, 29, 0.1)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "48px",
              height: "48px",
              lineHeight: "48px",
              borderRadius: "14px",
              backgroundColor: "#7B1E2B",
              color: "#F7F0E5",
              fontSize: "24px",
              fontWeight: 900,
              marginBottom: "16px",
            }}
          >
            F
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 900,
              margin: "0 0 10px 0",
              color: "#32171D",
            }}
          >
            Critical System Glitch
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6B4E55",
              lineHeight: 1.5,
              margin: "0 0 20px 0",
            }}
          >
            The application encountered a critical startup error. Don&apos;t worry, your puzzle progress is preserved locally.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: "#7B1E2B",
                color: "#F7F0E5",
                border: "none",
                borderRadius: "9999px",
                padding: "10px 22px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#32171D",
                border: "1px solid #C49A6C",
                borderRadius: "9999px",
                padding: "10px 22px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Return Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
