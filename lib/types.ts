export type EstadoInscripcion = "abierta" | "cerrada" | "desconocido";

export type Distancia = {
  km?: number;
  etiqueta?: string;
};

export type Evento = {
  id_canonico: string;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  municipio: string | null;
  municipio_meta: string | null;
  localidad: string | null;
  provincia: string | null;
  disciplina_normalizada: string | null;
  modalidad: string | null;
  distancias: Distancia[] | null;
  organizador: string | null;
  url_oficial: string | null;
  estado_inscripcion: EstadoInscripcion | string | null;
  lat: number | null;
  lng: number | null;
  etiquetas: string[] | null;
  recien_abierta: boolean | null;
  calidad_score: number | null;
};

export type Coords = {
  lat: number;
  lng: number;
};

export type GeoStatus = "idle" | "pending" | "granted" | "denied" | "unavailable";
