"use client";

// Only catches errors thrown by the root layout itself (font loading,
// providers, etc.) — everything else is handled by error.tsx, which
// renders inside the working layout instead of replacing <html>/<body>.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0b0d",
          color: "#ece7da",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#9aa1ad", marginTop: "0.5rem" }}>
          The application failed to load. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "2rem",
            background: "#c9a24b",
            color: "#0a0b0d",
            padding: "0.6rem 1.5rem",
            borderRadius: "0.375rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
