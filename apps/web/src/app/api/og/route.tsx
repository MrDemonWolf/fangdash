import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  let totalPlayers = 0;
  let totalMeters = 0;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const res = await fetch(`${apiUrl}/trpc/score.getGlobalStats`, {
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const json = (await res.json()) as {
          result?: { data?: { totalPlayers?: number; totalMeters?: number } };
        };
        totalPlayers = json.result?.data?.totalPlayers ?? 0;
        totalMeters = json.result?.data?.totalMeters ?? 0;
      }
    }
  } catch {
    // fall through with zeroes
  }

  const svgContent = readFileSync(
    join(process.cwd(), "public/icons/icon.svg"),
    "utf-8"
  );
  const svgBase64 = Buffer.from(svgContent).toString("base64");
  const svgSrc = `data:image/svg+xml;base64,${svgBase64}`;

  const formattedPlayers = totalPlayers.toLocaleString("en-US");
  const formattedMeters = totalMeters.toLocaleString("en-US");

  const image = new ImageResponse(
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
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 16,
          }}
        >
          <div
            style={{
              background: "rgba(15, 172, 237, 0.15)",
              border: "2px solid #0FACED",
              borderRadius: 48,
              padding: "12px 32px",
              fontSize: 28,
              color: "white",
              display: "flex",
            }}
          >
            {`👥 ${formattedPlayers} players`}
          </div>
          <div
            style={{
              background: "rgba(15, 172, 237, 0.15)",
              border: "2px solid #0FACED",
              borderRadius: 48,
              padding: "12px 32px",
              fontSize: 28,
              color: "white",
              display: "flex",
            }}
          >
            {`📏 ${formattedMeters} m run`}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
