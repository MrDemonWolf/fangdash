import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#091533",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: "#0FACED",
          letterSpacing: "-2px",
        }}
      >
        FANGDASH
      </div>
      <div style={{ fontSize: 32, color: "#94a3b8", marginTop: 16 }}>
        Race as wolves. Live on Twitch.
      </div>
    </div>
  );
}
