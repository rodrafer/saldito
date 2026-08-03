/** Franjas temporales para agrupar la actividad reciente (especificación 6.2). */
export type Franja = 'hoy' | 'semana' | 'antes';

export const ETIQUETA_FRANJA: Record<Franja, string> = {
  hoy: 'Hoy',
  semana: 'Esta semana',
  antes: 'Antes',
};

const UN_DIA_MS = 24 * 60 * 60 * 1000;

function aMedianoche(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * En qué franja cae una fecha respecto de `ahora`.
 *
 * Se compara por día calendario, no por diferencia de horas: un gasto de ayer a
 * las 23:00 tiene que decir "Esta semana" aunque hayan pasado apenas dos horas.
 * "Esta semana" son los últimos 7 días, no la semana corrida.
 */
export function franjaDe(fecha: string | Date, ahora: Date = new Date()): Franja {
  const dia = aMedianoche(new Date(fecha));
  const hoy = aMedianoche(ahora);
  const diasAtras = Math.round((hoy.getTime() - dia.getTime()) / UN_DIA_MS);

  if (diasAtras <= 0) return 'hoy';
  if (diasAtras < 7) return 'semana';
  return 'antes';
}

/**
 * Agrupa elementos por franja, conservando el orden de entrada dentro de cada
 * una y descartando las franjas vacías.
 */
export function agruparPorFranja<T>(
  items: readonly T[],
  fechaDe: (item: T) => string | Date,
  ahora: Date = new Date(),
): { franja: Franja; etiqueta: string; items: T[] }[] {
  const grupos: Record<Franja, T[]> = { hoy: [], semana: [], antes: [] };
  for (const item of items) grupos[franjaDe(fechaDe(item), ahora)].push(item);

  return (['hoy', 'semana', 'antes'] as const)
    .filter((f) => grupos[f].length > 0)
    .map((f) => ({ franja: f, etiqueta: ETIQUETA_FRANJA[f], items: grupos[f] }));
}
