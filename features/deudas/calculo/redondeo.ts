import type { UsuarioId } from '@/types';

/**
 * Reparto de enteros sin perder ni inventar unidades.
 *
 * Saldito no maneja centavos: los montos son enteros (pesos enteros en ARS,
 * dólares enteros en USD). Así que cada vez que hay que dividir plata entre
 * personas queda un sobrante, y lo que importa es que la suma cierre exacto
 * contra el total. Si no cierra, alguien paga de más por un error de redondeo.
 *
 * La especificación (secciones 2.1 a 2.3) define dos criterios distintos para
 * asignar ese sobrante, y no son intercambiables:
 *
 * - **En orden de lista**, cuando el reparto es en partes iguales. Todos los
 *   pedazos valen lo mismo, así que no hay nada que desempatar: se le da una
 *   unidad extra a los primeros de la lista.
 * - **Por mayor parte fraccionaria**, cuando el reparto es proporcional
 *   (porcentajes, o contribuciones desiguales). Acá sí hay un criterio justo:
 *   la unidad va a quien más cerca estaba de merecerla.
 *
 * Nota de implementación: los acumuladores son `Map` y recién al final se
 * convierten a objeto con `Object.fromEntries`. Con un objeto plano, un id
 * llamado `valueOf` o `__proto__` se leería a través de la cadena de
 * prototipos —`out[id] ?? 0` devolvería una función en vez de cero— y el
 * reparto quedaría mal. `Object.fromEntries` define propiedades propias, así
 * que el resultado es un objeto normal y seguro.
 */

/** Un monto entero asignado a una persona. */
export type Asignacion = Record<UsuarioId, number>;

/**
 * Lee un monto de un registro provisto por el usuario, ignorando todo lo que no
 * sea una propiedad propia y numérica.
 */
export function montoDe(
  registro: Readonly<Record<string, number>> | undefined,
  id: UsuarioId,
): number {
  if (!registro || !Object.hasOwn(registro, id)) return 0;
  const valor = registro[id];
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

/**
 * Divide `total` en partes iguales entre `ids`. El sobrante se asigna de a una
 * unidad, en orden de la lista.
 *
 * La suma del resultado es exactamente `total`.
 */
export function repartirEnPartesIguales(total: number, ids: readonly UsuarioId[]): Asignacion {
  if (ids.length === 0) return {};

  const base = Math.floor(total / ids.length);
  const sobrante = total - base * ids.length;

  const out = new Map<UsuarioId, number>();
  ids.forEach((id, i) => {
    // `id` puede repetirse si el llamador pasa duplicados: acumulamos en vez de
    // pisar, así la suma sigue cerrando.
    out.set(id, (out.get(id) ?? 0) + base + (i < sobrante ? 1 : 0));
  });
  return Object.fromEntries(out);
}

/**
 * Divide `total` entre las personas de `pesos`, en proporción a su peso.
 * El sobrante se asigna de a una unidad, empezando por quien haya quedado con
 * la mayor parte fraccionaria.
 *
 * La suma del resultado es exactamente `total`, cualquiera sea la escala de los
 * pesos: se normalizan contra su propia suma. Si todos los pesos son cero (o la
 * lista está vacía) no hay criterio proporcional posible y se cae a partes
 * iguales, que es lo único que mantiene la suma exacta.
 */
export function repartirProporcional(
  total: number,
  pesos: readonly { id: UsuarioId; peso: number }[],
): Asignacion {
  if (pesos.length === 0) return {};

  const sumaPesos = pesos.reduce((acc, p) => acc + p.peso, 0);
  if (sumaPesos <= 0) {
    return repartirEnPartesIguales(
      total,
      pesos.map((p) => p.id),
    );
  }

  const out = new Map<UsuarioId, number>();
  let asignado = 0;
  const fracciones: { id: UsuarioId; fraccion: number }[] = [];

  for (const { id, peso } of pesos) {
    const exacto = (total * peso) / sumaPesos;
    const piso = Math.floor(exacto);
    out.set(id, (out.get(id) ?? 0) + piso);
    asignado += piso;
    fracciones.push({ id, fraccion: exacto - piso });
  }

  // Orden estable: ante empate de parte fraccionaria gana quien viene primero
  // en la lista. Sin esto el resultado dependería del sort del motor y los
  // tests serían intermitentes.
  fracciones.sort((a, b) => b.fraccion - a.fraccion);

  let sobrante = total - asignado;
  for (let i = 0; i < fracciones.length && sobrante > 0; i++) {
    const id = fracciones[i].id;
    out.set(id, (out.get(id) ?? 0) + 1);
    sobrante--;
  }
  return Object.fromEntries(out);
}

/** Matriz de enteros `fila → columna → monto`. Interna al módulo de cálculo. */
export type Matriz = Record<UsuarioId, Record<UsuarioId, number>>;

/**
 * Reparte una matriz de enteros respetando **los dos márgenes a la vez**: cada
 * fila suma exactamente su total y cada columna también.
 *
 * Hace falta para atribuir deuda cuando un gasto tuvo varios pagadores. Ahí las
 * filas son los participantes (cada uno debe `reparto[q]`) y las columnas los
 * pagadores (a cada uno se le debe `puso[p]`). El saldo neto de una persona es
 * exactamente `su columna − su fila`, así que si las columnas no cierran
 * exacto, el saldo del grupo deja de dar cero.
 *
 * Redondear fila por fila —que es lo que sugiere el pseudocódigo de la
 * especificación— sólo garantiza las filas. Con dos personas que ponen y
 * consumen lo mismo, los empates de parte fraccionaria se resuelven siempre a
 * favor del primero de la lista y aparece una deuda de una unidad que no
 * existe. Por eso el reparto se hace en dos pasos:
 *
 * 1. Piso de cada celda, y el sobrante de cada fila por mayor parte
 *    fraccionaria. Las filas quedan exactas.
 * 2. Corrección de columnas: mientras una columna esté por encima de su total y
 *    otra por debajo, se mueve una unidad entre ellas **dentro de una misma
 *    fila**, que es lo que mantiene intactas las filas ya ajustadas.
 *
 * El paso 2 siempre puede avanzar: una columna que está por encima de su total
 * tiene suma mayor a cero, así que alguna de sus celdas vale al menos uno.
 */
export function repartirMatriz(
  filas: readonly { id: UsuarioId; total: number }[],
  columnas: readonly { id: UsuarioId; total: number }[],
): Matriz {
  if (filas.length === 0 || columnas.length === 0) return {};

  const total = columnas.reduce((acc, c) => acc + c.total, 0);
  if (total <= 0) {
    return Object.fromEntries(
      filas.map((f) => [f.id, Object.fromEntries(columnas.map((c) => [c.id, 0]))]),
    );
  }

  // Paso 1: piso por celda, y el sobrante de cada fila por mayor parte fraccionaria.
  const celdas = filas.map((f) => columnas.map((c) => Math.floor((f.total * c.total) / total)));

  filas.forEach((f, i) => {
    const fracciones = columnas
      .map((c, j) => {
        const exacto = (f.total * c.total) / total;
        return { j, fraccion: exacto - Math.floor(exacto) };
      })
      .sort((a, b) => b.fraccion - a.fraccion);

    let sobrante = f.total - celdas[i].reduce((a, b) => a + b, 0);
    for (let k = 0; k < fracciones.length && sobrante > 0; k++) {
      celdas[i][fracciones[k].j] += 1;
      sobrante--;
    }
  });

  // Paso 2: corregir las columnas moviendo unidades dentro de una misma fila.
  const desvio = columnas.map((c, j) => celdas.reduce((acc, fila) => acc + fila[j], 0) - c.total);

  for (let sobra = 0; sobra < columnas.length; sobra++) {
    while (desvio[sobra] > 0) {
      const falta = desvio.findIndex((d) => d < 0);
      if (falta === -1) break;

      const fila = celdas.findIndex((f) => f[sobra] >= 1);
      if (fila === -1) break;

      celdas[fila][sobra] -= 1;
      celdas[fila][falta] += 1;
      desvio[sobra] -= 1;
      desvio[falta] += 1;
    }
  }

  return Object.fromEntries(
    filas.map((f, i) => [f.id, Object.fromEntries(columnas.map((c, j) => [c.id, celdas[i][j]]))]),
  );
}
