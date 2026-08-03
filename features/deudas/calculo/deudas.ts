import {
  MONEDAS,
  type Deuda,
  type Gasto,
  type Grupo,
  type Integrante,
  type MonedaId,
  type Pago,
  type UsuarioId,
} from '@/types';
import { contribucionesDeGasto } from './contribuciones';
import { repartoDeGasto } from './reparto';
import { montoDe, repartirMatriz } from './redondeo';

/** Matriz `deudor → acreedor → monto` dentro de un mismo gasto. */
export type MatrizDeuda = Record<UsuarioId, Record<UsuarioId, number>>;

/**
 * Deudas que genera un gasto, persona contra persona (especificación 2.3).
 *
 * Cuando un gasto tuvo varios pagadores, cada participante le debe a cada
 * pagador **en proporción a lo que ese pagador puso**. Es la atribución que
 * respeta el hecho económico —quien puso más plata tiene más por recuperar—
 * sin inventar convenciones, y mantiene la estructura de deuda por par que
 * necesita la pantalla Deudas ("Rocío te debe $8.000", con su acción de pago).
 *
 * La porción que alguien se debe a sí mismo se descarta: se cancela sola.
 */
export function deudasDeGasto(g: Gasto): MatrizDeuda {
  if (g.monto <= 0) return {};

  const puso = contribucionesDeGasto(g);
  const debia = repartoDeGasto(g);
  const pagadores = Object.keys(puso);
  if (pagadores.length === 0) return {};

  // Filas: lo que debe cada participante. Columnas: lo que se le debe a cada
  // pagador. Se redondea preservando los dos márgenes, porque el saldo neto de
  // una persona es exactamente `su columna − su fila`: si las columnas no
  // cierran contra lo que puso cada uno, los saldos del grupo no dan cero.
  const matriz = repartirMatriz(
    g.participantes.map((p) => ({ id: p, total: montoDe(debia, p) })),
    pagadores.map((q) => ({ id: q, total: montoDe(puso, q) })),
  );

  const out: MatrizDeuda = {};

  for (const participante of g.participantes) {
    for (const acreedor of pagadores) {
      if (acreedor === participante) continue; // la porción propia se cancela sola

      const monto = matriz[participante]?.[acreedor] ?? 0;
      if (monto <= 0) continue;

      out[participante] ??= {};
      out[participante][acreedor] = (out[participante][acreedor] ?? 0) + monto;
    }
  }

  return out;
}

/** Acumulado `moneda → deudor → acreedor → monto`. */
type Acumulado = Map<UsuarioId, Map<UsuarioId, number>>;

function sumarEn(acc: Acumulado, deudor: UsuarioId, acreedor: UsuarioId, monto: number) {
  let fila = acc.get(deudor);
  if (!fila) {
    fila = new Map();
    acc.set(deudor, fila);
  }
  fila.set(acreedor, (fila.get(acreedor) ?? 0) + monto);
}

function leerEn(acc: Acumulado, deudor: UsuarioId, acreedor: UsuarioId): number {
  return acc.get(deudor)?.get(acreedor) ?? 0;
}

/**
 * Deudas vigentes del grupo, neteadas por par y por moneda (especificación 2.4).
 *
 * Se derivan siempre desde los gastos: no existe la entidad Deuda y no se
 * persiste nada. Si A le debe 100 a B y B le debe 30 a A, queda una sola deuda:
 * A debe 70 a B.
 *
 * ARS y USD **nunca se mezclan**. Dos personas pueden tener una deuda en cada
 * moneda y se saldan por separado (especificación 1.3).
 *
 * `integrantes` se recibe aparte porque `Grupo` no los contiene: son una entidad
 * propia, igual que en la base. Se toman todos, **incluidos los inactivos**: una
 * persona desactivada sigue apareciendo en los históricos y no puede salir del
 * grupo con deudas abiertas, así que sus saldos tienen que seguir contando.
 */
export function calcularDeudas(
  gastos: readonly Gasto[],
  pagos: readonly Pago[],
  grupo: Grupo,
  integrantes: readonly Integrante[],
): Deuda[] {
  const vigentes = gastos.filter((g) => g.grupoId === grupo.id && !g.anulado && !g.borrador);

  const acc = new Map<MonedaId, Acumulado>(MONEDAS.map((m) => [m, new Map()]));
  // Los gastos que originaron cada deuda, para poder mostrar su detalle.
  // Va por moneda: un mismo par puede deberse plata en ARS y en USD por gastos
  // distintos, y mezclar los orígenes mostraría gastos que no corresponden.
  const origen = new Map<MonedaId, Map<UsuarioId, Map<UsuarioId, string[]>>>(
    MONEDAS.map((m) => [m, new Map()]),
  );

  for (const g of vigentes) {
    const matriz = deudasDeGasto(g);
    const accMoneda = acc.get(g.moneda);
    const origenMoneda = origen.get(g.moneda);
    if (!accMoneda || !origenMoneda) continue; // moneda desconocida: se ignora

    for (const [deudor, fila] of Object.entries(matriz)) {
      for (const [acreedor, monto] of Object.entries(fila)) {
        sumarEn(accMoneda, deudor, acreedor, monto);

        let porAcreedor = origenMoneda.get(deudor);
        if (!porAcreedor) {
          porAcreedor = new Map();
          origenMoneda.set(deudor, porAcreedor);
        }
        porAcreedor.set(acreedor, [...(porAcreedor.get(acreedor) ?? []), g.id]);
      }
    }
  }

  // Los pagos registrados reducen la deuda del deudor hacia el acreedor.
  // Cuentan los declarados por el deudor todavía sin confirmar: reducen la deuda
  // igual, y el acreedor los confirma después (especificación 2.7).
  for (const pago of pagos) {
    if (pago.grupoId !== grupo.id) continue;
    const accMoneda = acc.get(pago.moneda);
    if (!accMoneda) continue;
    sumarEn(accMoneda, pago.deudorId, pago.acreedorId, -pago.monto);
  }

  const ids = integrantes.filter((i) => i.grupoId === grupo.id).map((i) => i.usuarioId);
  const out: Deuda[] = [];

  for (const moneda of MONEDAS) {
    const accMoneda = acc.get(moneda);
    const origenMoneda = origen.get(moneda);
    if (!accMoneda || !origenMoneda) continue;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const neto = leerEn(accMoneda, a, b) - leerEn(accMoneda, b, a);

        // Umbral de una unidad: diferencias menores se descartan para no dejar
        // deudas fantasma de $1 que nadie va a pagar. Como todos los montos son
        // enteros, en la práctica esto sólo descarta el cero.
        if (Math.abs(neto) < 1) continue;

        out.push({
          deudorId: neto > 0 ? a : b,
          acreedorId: neto > 0 ? b : a,
          moneda,
          monto: Math.round(Math.abs(neto)),
          gastoIds: [
            ...new Set([
              ...(origenMoneda.get(a)?.get(b) ?? []),
              ...(origenMoneda.get(b)?.get(a) ?? []),
            ]),
          ],
        });
      }
    }
  }

  return out;
}
