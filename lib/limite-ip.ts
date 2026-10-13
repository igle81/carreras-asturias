export type CuboLimite = {
  contar: (clave: string, ahora?: number) => { permitido: boolean; restantes: number };
};

/** Ventana fija en memoria. En serverless cada instancia lleva la suya. */
export function crearLimiteIp(opciones: { max: number; ventanaMs: number }): CuboLimite {
  const golpes = new Map<string, number[]>();

  return {
    contar(clave: string, ahora = Date.now()) {
      const previos = (golpes.get(clave) ?? []).filter((marca) => ahora - marca < opciones.ventanaMs);
      if (previos.length >= opciones.max) {
        golpes.set(clave, previos);
        return { permitido: false, restantes: 0 };
      }
      previos.push(ahora);
      golpes.set(clave, previos);
      return { permitido: true, restantes: opciones.max - previos.length };
    },
  };
}

export function ipDeLaPeticion(cabeceras: { get(nombre: string): string | null }): string {
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) {
    const primera = reenviada.split(",")[0]?.trim();
    if (primera) return primera.slice(0, 80);
  }
  const real = cabeceras.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);
  return "desconocida";
}

export const limiteRegistro = crearLimiteIp({ max: 8, ventanaMs: 15 * 60 * 1000 });
export const limiteClicAfiliado = crearLimiteIp({ max: 30, ventanaMs: 60 * 1000 });
export const limiteClicVip = crearLimiteIp({ max: 30, ventanaMs: 60 * 1000 });
