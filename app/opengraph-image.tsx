import { ImageResponse } from "next/og";

export const alt = "Sayyad Adeel — Independent Builder & Designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f2",
          fontFamily: "sans-serif",
        }}
      >
        {/* Frame corners */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 48,
            width: 24,
            height: 24,
            borderTop: "2px solid rgba(0,0,0,0.25)",
            borderLeft: "2px solid rgba(0,0,0,0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 48,
            width: 24,
            height: 24,
            borderTop: "2px solid rgba(0,0,0,0.25)",
            borderRight: "2px solid rgba(0,0,0,0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 48,
            width: 24,
            height: 24,
            borderBottom: "2px solid rgba(0,0,0,0.25)",
            borderLeft: "2px solid rgba(0,0,0,0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 48,
            width: 24,
            height: 24,
            borderBottom: "2px solid rgba(0,0,0,0.25)",
            borderRight: "2px solid rgba(0,0,0,0.25)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            border: "1.5px dashed rgba(0,0,0,0.18)",
            padding: "14px 28px",
            marginBottom: 44,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "#121212",
          }}
        >
          Independent Builder &amp; Designer
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 84,
            letterSpacing: "-3px",
            color: "#121212",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          I design and build digital experiences with AI
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "-0.5px",
            color: "rgba(0,0,0,0.5)",
            marginTop: 40,
          }}
        >
          sayyadadeel.tech
        </div>
      </div>
    ),
    { ...size }
  );
}
