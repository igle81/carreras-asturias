/** Tipos públicos de la pieza «Mapa de banderillas». No dependen de ningún proyecto. */

/** Punto tal y como llega en los datos de entrada. Solo `lat` y `lon` son imprescindibles. */
export type PuntoEntrada = {
  nombre?: string;
  lat: number | string;
  /** También se acepta `lng` como sinónimo. */
  lon?: number | string;
  lng?: number | string;
  categoria?: string;
  /** Fecha ISO: «2026-10-17» o «2026-10-17T10:30:00». */
  fecha?: string;
  /** Opcional: dirección http(s) que se muestra como «Página oficial». */
  enlace?: string;
  /** Opcional: nombre del sitio, que encabeza la ventana si hay varios puntos juntos. */
  lugar?: string;
};

/** Punto ya comprobado y normalizado. */
export type Punto = {
  nombre: string;
  lat: number;
  lon: number;
  categoria: string;
  /** Día en formato AAAA-MM-DD, o `null` si no venía o no era válido. */
  fecha: string | null;
  enlace: string | null;
  lugar: string | null;
};

export type EstiloCategoria = {
  /** Nombre que se muestra en la ventana. Si falta, se usa la clave de la categoría. */
  nombre?: string;
  /** Color CSS de la banderilla: «#0e5a4e», «rgb(14 90 78)» o un nombre como «teal». */
  color?: string;
  /** Símbolo dentro de la banderilla (un emoji o un carácter). */
  icono?: string;
};

export type Textos = {
  comoLlegar: string;
  enlace: string;
  sinNombre: string;
  sinCategoria: string;
  masEnElPunto: (cuantos: number) => string;
  etiquetaMapa: string;
};

export type OpcionesMapa = {
  /** Color, icono y nombre por clave de categoría. Las no listadas usan `estiloPorDefecto`. */
  categorias?: Record<string, EstiloCategoria>;
  estiloPorDefecto?: EstiloCategoria;
  /** Centro inicial [lat, lon]. Por defecto, Asturias. Con `ajusteAutomatico` solo vale si no hay puntos. */
  centro?: [number, number];
  /** Zoom inicial (por defecto 8). */
  zoom?: number;
  /** Encuadra todos los puntos al cargarlos (por defecto sí). */
  ajusteAutomatico?: boolean;
  /** Zoom máximo del encuadre automático (por defecto 11). */
  zoomMaximoAjuste?: number;
  /** Margen del encuadre en píxeles (por defecto 36). */
  margenAjuste?: number;
  /** Zoom con la rueda del ratón (por defecto no, para no atrapar el desplazamiento de la página). */
  zoomConRueda?: boolean;
  /** Muestra el enlace «Cómo llegar» (Google Maps, sin clave) en la ventana. Por defecto no. */
  comoLlegar?: boolean;
  /** Origen del trayecto: coordenadas o texto. Si falta, Google Maps usa la ubicación del dispositivo. */
  origenComoLlegar?: { lat: number; lon: number } | string | null;
  textos?: Partial<Textos>;
  /** Mapa base. Por defecto, OpenStreetMap (ver README: atribución y normas de uso). */
  teselas?: { url: string; atribucion: string; zoomMaximo?: number };
  /** Se llama al abrir una banderilla, con los puntos que agrupa. */
  alAbrirBanderilla?: (puntos: Punto[]) => void;
  /** Si viene, el mapa se acerca a este punto (por ejemplo, al pulsar «Ver en el mapa»). */
  foco?: { lat: number; lon: number } | null;
};

export type Grupo = { clave: string; lat: number; lon: number; puntos: Punto[]; categoria: string };

export type ControlMapa = {
  /** Cambia los puntos (se validan de nuevo) y, si procede, reencuadra. Devuelve cuántos se aceptaron. */
  actualizar: (puntos: unknown, opciones?: OpcionesMapa) => Promise<number>;
  /** Reencuadra sobre todos los puntos. */
  ajustar: () => void;
  /** Quita el mapa y libera los recursos. */
  destruir: () => void;
};
