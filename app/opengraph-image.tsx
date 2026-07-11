import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Grainy Palace Financial Service — Save a little every day. Build something big.";

export default async function OpengraphImage() {
  const iconPath = path.join(process.cwd(), "public", "brand", "icon-512.png");
  const iconBuffer = await readFile(iconPath);
  const iconDataUrl = `data:image/png;base64,${iconBuffer.toString("base64")}`;

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
          backgroundImage: "linear-gradient(135deg, #051429, #112239)",
          padding: 80,
        }}
      >
        {/* Light chip behind the icon: its pediment/base bars are baked in as navy,
            which would otherwise vanish against this navy gradient background. */}
        <div
          style={{
            display: "flex",
            padding: 20,
            borderRadius: 999,
            backgroundColor: "#FAFAF7",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconDataUrl} width={140} height={140} alt="" />
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          GRAINY PALACE
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 24,
            letterSpacing: 6,
            color: "#D4AF37",
            textTransform: "uppercase",
          }}
        >
          Financial Service
        </div>
        <div
          style={{
            marginTop: 28,
            height: 4,
            width: 160,
            backgroundImage: "linear-gradient(45deg, #8A6623, #D4AF37, #F9E8B2, #D4AF37, #A67C1E)",
            borderRadius: 999,
          }}
        />
        <div style={{ marginTop: 28, fontSize: 28, color: "#f5f3ec", textAlign: "center" }}>
          Save a little every day. Build something big.
        </div>
      </div>
    ),
    { ...size }
  );
}
