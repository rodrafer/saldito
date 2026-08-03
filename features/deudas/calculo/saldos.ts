import {
  MONEDAS,
  type Deuda,
  type Grupo,
  type Integrante,
  type MonedaId,
  type Saldos,
  type UsuarioId,
} from '@/types';

/**
 * Saldo neto de cada integrante, separado por moneda (especificación 2.5).
 *
 * Positivo = le deben. Negativo = debe. Es lo que muestra el Dashboard y lo que
 * come el plan simplificado para armar los movimientos.
 *
 * Invariantes (cubiertos por los tests):
 * 1. Para cada moneda, la suma de todos los saldos del grupo es **cero**.
 * 2. El saldo de cada persona coincide con `puso − consumió` calculado directo
 *    desde los gastos. Si las dos vías no dan lo mismo, hay un bug de redondeo
 *    en la atribución proporcional de `deudasDeGasto`.
 */
export function calcularSaldos(
  deudas: readonly Deuda[],
  grupo: Grupo,
  integrantes: readonly Integrante[],
): Saldos {
  const acc = new Map<MonedaId, Map<UsuarioId, number>>(MONEDAS.map((m) => [m, new Map()]));

  for (const moneda of MONEDAS) {
    for (const integrante of integrantes) {
      if (integrante.grupoId !== grupo.id) continue;
      acc.get(moneda)?.set(integrante.usuarioId, 0);
    }
  }

  for (const d of deudas) {
    const porMoneda = acc.get(d.moneda);
    if (!porMoneda) continue;
    porMoneda.set(d.deudorId, (porMoneda.get(d.deudorId) ?? 0) - d.monto);
    porMoneda.set(d.acreedorId, (porMoneda.get(d.acreedorId) ?? 0) + d.monto);
  }

  return {
    ARS: Object.fromEntries(acc.get('ARS') ?? []),
    USD: Object.fromEntries(acc.get('USD') ?? []),
  };
}
