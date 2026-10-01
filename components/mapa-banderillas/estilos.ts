/**
 * Estilos de las banderillas y del contenedor. Todo cuelga de la clase `.mbd-mapa` y las clases llevan el prefijo `mbd-`,
 * así que no chocan con los de la página que lo use. Las reglas de Leaflet (`leaflet/dist/leaflet.css`) se cargan aparte.
 */
export const CSS = `
.mbd-mapa{position:relative;z-index:0;isolation:isolate;width:100%;overflow:hidden;border:1px solid #cfd8d4;border-radius:1.25rem;background:#e9efec;font-family:inherit}
.mbd-mapa .leaflet-control-attribution{font-size:11px}
.mbd-mapa .mbd-pin{background:transparent;border:0}
.mbd-mapa .mbd-pin span{display:grid;place-items:center;width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 3px 8px rgb(0 0 0/.35)}
.mbd-mapa .mbd-pin span b{transform:rotate(45deg);font-size:18px;line-height:1;font-weight:400}
.mbd-mapa .mbd-pin i{position:absolute;right:-4px;top:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#10261f;color:#fff;font:700 11px/20px system-ui,sans-serif;text-align:center;border:2px solid #fff;font-style:normal;box-sizing:border-box}
.mbd-mapa .mbd-pin.mbd-activo span{box-shadow:0 0 0 4px rgb(227 163 43/.9),0 3px 8px rgb(0 0 0/.35)}
.mbd-ventana{max-width:260px;color:#10261f}
.mbd-ventana p{margin:0 0 6px;font-weight:700;font-size:14px}
.mbd-ventana ul{margin:0;padding:0;list-style:none;display:grid;gap:8px;max-height:200px;overflow:auto}
.mbd-ventana .mbd-t{font-size:13px;line-height:1.3}
.mbd-ventana .mbd-m{font-size:12px;color:#465a53}
.mbd-ventana a{font-size:12px;font-weight:600;color:#0e5a4e;margin-right:10px}
.mbd-ventana .mbd-mas{margin:6px 0 0;font-weight:400;font-size:12px;color:#465a53}
`;

const ID = "mbd-estilos";

/** Inserta los estilos una sola vez en el documento. */
export function instalarEstilos(doc: Document = document): void {
  if (doc.getElementById(ID)) return;
  const e = doc.createElement("style");
  e.id = ID;
  e.textContent = CSS;
  doc.head.appendChild(e);
}
