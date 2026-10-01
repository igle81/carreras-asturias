import type { Map as MapaLeaflet, Marker } from "leaflet";
import { enlaceComoLlegar, textoFecha, validarPuntos } from "./datos";
import { instalarEstilos } from "./estilos";
import type { ControlMapa, EstiloCategoria, Grupo, OpcionesMapa, Punto, Textos } from "./tipos";

/** Núcleo sin React: crea el mapa dentro de un elemento. Lo usan el componente de React y la demostración HTML. */

export const TEXTOS: Textos = {
  comoLlegar: "Cómo llegar",
  enlace: "Página oficial",
  sinNombre: "Sin nombre",
  sinCategoria: "sin-categoria",
  masEnElPunto: (n) => `y ${n} más en este punto`,
  etiquetaMapa: "Mapa de puntos. Cada banderilla es un lugar con uno o varios puntos.",
};

export const ESTILO_POR_DEFECTO: Required<EstiloCategoria> = { nombre: "", color: "#0e5a4e", icono: "📍" };
export const CENTRO_POR_DEFECTO: [number, number] = [43.36, -5.85]; // Oviedo
const TESELAS = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  atribucion: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">colaboradores de OpenStreetMap</a>',
  zoomMaximo: 18,
};

/** Agrupa los puntos que caen en el mismo lugar (4 decimales, unos 10 m) para no apilar banderillas. */
export function agrupar(puntos: Punto[]): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const p of puntos) {
    const clave = `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;
    const g = mapa.get(clave) ?? { clave, lat: p.lat, lon: p.lon, puntos: [], categoria: p.categoria };
    g.puntos.push(p);
    mapa.set(clave, g);
  }
  for (const g of mapa.values()) {
    const cuenta = new Map<string, number>();
    for (const p of g.puntos) cuenta.set(p.categoria, (cuenta.get(p.categoria) ?? 0) + 1);
    g.categoria = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  return [...mapa.values()];
}

/** Colores admitidos en el atributo de estilo sin abrir la puerta a inyecciones: se descarta lo que lleve comillas, `;`, `<` o `>`. */
export function colorSeguro(valor: string | undefined, porDefecto: string): string {
  return valor && /^[#a-zA-Z0-9(),.%\s/-]{1,60}$/.test(valor) ? valor : porDefecto;
}

function escapar(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function iconoDe(L: typeof import("leaflet"), color: string, glifo: string, cuantos: number, activo: boolean) {
  return L.divIcon({
    className: `mbd-pin${activo ? " mbd-activo" : ""}`,
    html: `<span style="background:${colorSeguro(color, ESTILO_POR_DEFECTO.color)}"><b>${escapar(glifo)}</b></span>${cuantos > 1 ? `<i>${cuantos}</i>` : ""}`,
    iconSize: [38, 38],
    iconAnchor: [19, 40],
    popupAnchor: [0, -36],
  });
}

type LeafletNs = typeof import("leaflet");

/** Leaflet 1.9 publica un módulo CommonJS. Next a veces lo envuelve en `default`. */
async function cargarLeaflet(): Promise<LeafletNs> {
  const modulo = await import("leaflet");
  const conDefecto = modulo as LeafletNs & { default?: LeafletNs };
  return conDefecto.default?.map ? conDefecto.default : modulo;
}

export async function crearMapa(contenedor: HTMLElement, puntosEntrada: unknown, opciones: OpcionesMapa = {}): Promise<ControlMapa> {
  const L = await cargarLeaflet();
  instalarEstilos(contenedor.ownerDocument);
  contenedor.classList.add("mbd-mapa");
  contenedor.setAttribute("role", "region");

  let op = opciones;
  let textos: Textos = { ...TEXTOS, ...op.textos };
  contenedor.setAttribute("aria-label", textos.etiquetaMapa);
  const tes = op.teselas ?? TESELAS;
  const mapa: MapaLeaflet = L.map(contenedor, { zoomControl: true, scrollWheelZoom: op.zoomConRueda ?? false }).setView(
    op.centro ?? CENTRO_POR_DEFECTO,
    op.zoom ?? 8,
  );
  L.tileLayer(tes.url, { maxZoom: ("zoomMaximo" in tes && tes.zoomMaximo) || 18, attribution: tes.atribucion }).addTo(mapa);
  setTimeout(() => mapa.invalidateSize(), 50);

  const marcadores: { mk: Marker; lat: number; lon: number }[] = [];
  let todos: Punto[] = [];

  const estilo = (clave: string): Required<EstiloCategoria> => {
    const e = op.categorias?.[clave] ?? {};
    const d = op.estiloPorDefecto ?? {};
    return {
      nombre: e.nombre ?? d.nombre ?? clave,
      color: colorSeguro(e.color ?? d.color, ESTILO_POR_DEFECTO.color),
      icono: e.icono ?? d.icono ?? ESTILO_POR_DEFECTO.icono,
    };
  };

  const ventana = (g: Grupo): HTMLElement => {
    const raiz = document.createElement("div");
    raiz.className = "mbd-ventana";
    const lugar = document.createElement("p");
    lugar.textContent = g.puntos.find((p) => p.lugar)?.lugar ?? (g.puntos.length === 1 ? g.puntos[0].nombre : `${g.puntos.length} puntos`);
    if (g.puntos.length === 1 && !g.puntos[0].lugar) lugar.style.display = "none";
    raiz.appendChild(lugar);
    const lista = document.createElement("ul");
    for (const p of g.puntos.slice(0, 8)) {
      const li = document.createElement("li");
      const e = estilo(p.categoria);
      const t = document.createElement("div");
      t.className = "mbd-t";
      t.textContent = `${e.icono} ${p.nombre}`;
      const m = document.createElement("div");
      m.className = "mbd-m";
      m.textContent = [e.nombre || p.categoria, p.fecha ? textoFecha(p.fecha) : null].filter(Boolean).join(" · ");
      li.append(t, m);
      if (p.enlace) {
        const a = document.createElement("a");
        a.href = p.enlace;
        // La ficha vive en este sitio: se abre aquí. El resto (Cómo llegar, páginas externas) va en otra pestaña.
        if (!p.enlace.startsWith("/")) {
          a.target = "_blank";
          a.rel = "noreferrer noopener";
        }
        a.textContent = textos.enlace;
        li.appendChild(a);
      }
      if (op.comoLlegar) {
        const a = document.createElement("a");
        a.href = enlaceComoLlegar(p, op.origenComoLlegar);
        a.target = "_blank";
        a.rel = "noreferrer noopener";
        a.textContent = textos.comoLlegar;
        li.appendChild(a);
      }
      lista.appendChild(li);
    }
    raiz.appendChild(lista);
    if (g.puntos.length > 8) {
      const mas = document.createElement("p");
      mas.className = "mbd-mas";
      mas.textContent = textos.masEnElPunto(g.puntos.length - 8);
      raiz.appendChild(mas);
    }
    return raiz;
  };

  const ajustar = () => {
    if (todos.length === 0) {
      mapa.setView(op.centro ?? CENTRO_POR_DEFECTO, op.zoom ?? 8);
      return;
    }
    const m = op.margenAjuste ?? 36;
    mapa.fitBounds(L.latLngBounds(todos.map((p) => [p.lat, p.lon] as [number, number])), {
      padding: [m, m],
      maxZoom: op.zoomMaximoAjuste ?? 11,
    });
  };

  const encuadrar = () => {
    const foco = op.foco;
    if (foco && Number.isFinite(foco.lat) && Number.isFinite(foco.lon)) {
      mapa.flyTo([foco.lat, foco.lon], op.zoomMaximoAjuste ?? 11, { duration: 0.45 });
      marcadores
        .find((marca) => Math.abs(marca.lat - foco.lat) < 0.0002 && Math.abs(marca.lon - foco.lon) < 0.0002)
        ?.mk.openPopup();
      return;
    }
    if (op.ajusteAutomatico ?? true) ajustar();
  };

  const pintar = (entrada: unknown): number => {
    for (const marca of marcadores) marca.mk.remove();
    marcadores.length = 0;
    const { validos } = validarPuntos(entrada, textos.sinNombre, textos.sinCategoria);
    todos = validos;
    for (const g of agrupar(validos)) {
      const e = estilo(g.categoria);
      const mk = L.marker([g.lat, g.lon], {
        icon: iconoDe(L, e.color, e.icono, g.puntos.length, false),
        title: g.puntos.map((p) => p.nombre).slice(0, 3).join(" · "),
        alt: g.puntos[0].nombre,
      }).addTo(mapa);
      mk.bindPopup(() => ventana(g), { maxWidth: 280 });
      mk.on("popupopen", () => {
        mk.setIcon(iconoDe(L, e.color, e.icono, g.puntos.length, true));
        op.alAbrirBanderilla?.(g.puntos);
      });
      mk.on("popupclose", () => mk.setIcon(iconoDe(L, e.color, e.icono, g.puntos.length, false)));
      marcadores.push({ mk, lat: g.lat, lon: g.lon });
    }
    encuadrar();
    return validos.length;
  };

  pintar(puntosEntrada);

  return {
    actualizar: async (puntos, nuevas) => {
      if (nuevas) {
        op = nuevas;
        textos = { ...TEXTOS, ...op.textos };
      }
      return pintar(puntos);
    },
    ajustar,
    destruir: () => {
      mapa.remove();
      marcadores.length = 0;
    },
  };
}
