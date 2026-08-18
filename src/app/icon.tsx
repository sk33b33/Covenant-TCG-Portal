import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0b0d",
          borderRadius: 6,
        }}
      >
        <span style={{ fontSize: 20, color: "#c9a24b", fontWeight: 700 }}>C</span>
      </div>
    ),
    size,
  );
}
