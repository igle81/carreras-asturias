import { ImageResponse } from "next/og";

export const alt = "Carreras Asturias: calendario de trail, running y ciclismo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** og:image 1200×630 con los colores de la app (plan SEO parte A). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0b3d2e 0%, #0b3d2e 55%, #0e7490 100%)",
          color: "#f4f1ea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: "#e0b44a" }} />
          <div style={{ fontSize: 30, letterSpacing: 4, textTransform: "uppercase", color: "#e0b44a" }}>
            www.carrerasasturias.es
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>Carreras Asturias</div>
          <div style={{ fontSize: 44, marginTop: 24, color: "#ffffff" }}>
            Calendario de trail, running y ciclismo
          </div>
        </div>
        <div style={{ fontSize: 30, color: "#f4f1ea" }}>
          Inscripciones abiertas · por concejo y fecha · Parte de AvilesIA
        </div>
      </div>
    ),
    size,
  );
}
