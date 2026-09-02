"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="lt">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f5f5f5",
          color: "#0a0a0a",
        }}
      >
        <div style={{ maxWidth: 360, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>
            Valgyklos VPM
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>
            Programėlė netikėtai nustojo veikti. Bandykite dar kartą.
            <br />
            Приложение неожиданно перестало работать. Попробуйте еще раз.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: 0,
              background: "#0a0a0a",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Bandyti dar kartą
          </button>
        </div>
      </body>
    </html>
  );
}
