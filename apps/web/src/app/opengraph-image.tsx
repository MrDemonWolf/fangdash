import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "FangDash";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const svgContent = readFileSync(
    join(process.cwd(), "public/icons/icon.svg"),
    "utf-8"
  );
  const svgBase64 = Buffer.from(svgContent).toString("base64");
  const svgSrc = `data:image/svg+xml;base64,${svgBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#091533",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <img src={svgSrc} width={120} height={120} alt="" />
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          FangDash
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#0FACED",
            fontWeight: 500,
          }}
        >
          A multiplayer endless runner on Twitch
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
