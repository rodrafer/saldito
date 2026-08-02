import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { MONEDAS, type Gasto, type MonedaId } from '@/types';
import { contribucionesDeGasto } from './contribuciones';
import { repartoDeGasto } from './reparto';
import { calcularDeudas } from './deudas';
import { calcularSaldos } from './saldos';
import { derivarMovimientos } from './movimientos';
import { GRUPO_ID, grupo, integrantes, particion, saldoDirecto, suma } from '@/tests/factories';

/**
 * Invariantes del núcleo de cálculo.
 *
 * La especificación los señala como la mejor red de seguridad del sistema: si
 * alguno se rompe, hay un bug de redondeo en la atribución proporcional y
 * alguien termina pagando de más. Se verifican con property testing sobre
 * gastos generados al azar, porque los casos que fallan son justamente los que
 * uno no se le ocurre escribir a mano.
 */

const PERSONAS = ['ana', 'beto', 'caro', 'dani'] as const;
const CASA = grupo();
const INTEGRANTES = integrantes([...PERSONAS]);

/** Subconjunto no vacío de personas, preservando el orden. */
const subconjunto = fc
  .array(fc.boolean(), { minLength: PERSONAS.length, maxLength: PERSONAS.length })
  .map((flags) => {
    const elegidos = PERSONAS.filter((_, i) => flags[i]);
    return elegidos.length > 0 ? [...elegidos] : [PERSONAS[0]];
  });

const cortes = fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), {
  minLength: PERSONAS.length,
  maxLength: PERSONAS.length,
});

/** Genera un gasto válido según las reglas de integridad de la sección 1.2. */
const gastoArbitrario = fc
  .record({
    id: fc.string({ minLength: 1, maxLength: 6 }),
    monto: fc.integer({ min: 1, max: 5_000_000 }),
    moneda: fc.constantFrom<MonedaId>(...MONEDAS),
    pagadores: subconjunto,
    participantes: subconjunto,
    modoPago: fc.constantFrom('iguales' as const, 'montos' as const),
    modoReparto: fc.constantFrom('iguales' as const, 'porcentaje' as const, 'montos' as const),
    cortesPago: cortes,
    cortesReparto: cortes,
  })
  .map(
    ({
      id,
      monto,
      moneda,
      pagadores,
      participantes,
      modoPago,
      modoReparto,
      cortesPago,
      cortesReparto,
    }): Gasto => {
      const montosPago = particion(monto, pagadores.length, cortesPago);
      const contribuciones = Object.fromEntries(pagadores.map((p, i) => [p, montosPago[i]]));

      let reparto: Record<string, number> | undefined;
      if (modoReparto === 'montos') {
        const partes = particion(monto, participantes.length, cortesReparto);
        reparto = Object.fromEntries(participantes.map((p, i) => [p, partes[i]]));
      } else if (modoReparto === 'porcentaje') {
        const partes = particion(100, participantes.length, cortesReparto);
        reparto = Object.fromEntries(participantes.map((p, i) => [p, partes[i]]));
      }

      return {
        id,
        grupoId: GRUPO_ID,
        titulo: 'Gasto',
        categoriaId: 'c1',
        moneda,
        monto,
        fecha: '2026-06-01T12:00:00.000Z',
        modoPago,
        contribuciones,
        modoReparto,
        participantes,
        reparto,
        anulado: false,
        historial: [],
      };
    },
  );

const gastosArbitrarios = fc.array(gastoArbitrario, { minLength: 1, maxLength: 12 });

describe('invariantes por gasto', () => {
  it('las contribuciones suman exactamente el monto', () => {
    fc.assert(
      fc.property(gastoArbitrario, (g) => {
        expect(suma(contribucionesDeGasto(g))).toBe(g.monto);
      }),
    );
  });

  it('el reparto suma exactamente el monto', () => {
    fc.assert(
      fc.property(gastoArbitrario, (g) => {
        expect(suma(repartoDeGasto(g))).toBe(g.monto);
      }),
    );
  });

  it('nadie recibe ni debe un monto negativo', () => {
    fc.assert(
      fc.property(gastoArbitrario, (g) => {
        for (const monto of Object.values(contribucionesDeGasto(g))) {
          expect(monto).toBeGreaterThanOrEqual(0);
        }
        for (const monto of Object.values(repartoDeGasto(g))) {
          expect(monto).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it('todos los montos son enteros: nunca se reparte plata fraccionada', () => {
    fc.assert(
      fc.property(gastoArbitrario, (g) => {
        for (const monto of Object.values(repartoDeGasto(g))) {
          expect(Number.isInteger(monto)).toBe(true);
        }
      }),
    );
  });
});

describe('invariantes del grupo', () => {
  it('por moneda, la suma de todos los saldos del grupo es cero', () => {
    fc.assert(
      fc.property(gastosArbitrarios, (gastos) => {
        const deudas = calcularDeudas(gastos, [], CASA, INTEGRANTES);
        const saldos = calcularSaldos(deudas, CASA, INTEGRANTES);

        for (const moneda of MONEDAS) {
          expect(suma(saldos[moneda])).toBe(0);
        }
      }),
    );
  });

  it('el saldo de cada persona coincide con puso − consumió', () => {
    // Es el invariante que la especificación marca como el más importante:
    // contrasta el camino largo (deuda por par, con su redondeo proporcional)
    // contra el cálculo directo desde los gastos. Si difieren, el redondeo de
    // deudasDeGasto está perdiendo o inventando unidades.
    fc.assert(
      fc.property(gastosArbitrarios, (gastos) => {
        const deudas = calcularDeudas(gastos, [], CASA, INTEGRANTES);
        const saldos = calcularSaldos(deudas, CASA, INTEGRANTES);

        for (const moneda of MONEDAS) {
          for (const persona of PERSONAS) {
            expect(saldos[moneda][persona]).toBe(
              saldoDirecto(gastos, moneda, persona, contribucionesDeGasto, repartoDeGasto),
            );
          }
        }
      }),
    );
  });

  it('el saldo de cada persona coincide con la suma de sus deudas por par', () => {
    fc.assert(
      fc.property(gastosArbitrarios, (gastos) => {
        const deudas = calcularDeudas(gastos, [], CASA, INTEGRANTES);
        const saldos = calcularSaldos(deudas, CASA, INTEGRANTES);

        for (const moneda of MONEDAS) {
          for (const persona of PERSONAS) {
            const porPar = deudas
              .filter((d) => d.moneda === moneda)
              .reduce((acc, d) => {
                if (d.acreedorId === persona) return acc + d.monto;
                if (d.deudorId === persona) return acc - d.monto;
                return acc;
              }, 0);

            expect(saldos[moneda][persona]).toBe(porPar);
          }
        }
      }),
    );
  });

  it('una deuda nunca queda con monto negativo ni con deudor igual al acreedor', () => {
    fc.assert(
      fc.property(gastosArbitrarios, (gastos) => {
        for (const d of calcularDeudas(gastos, [], CASA, INTEGRANTES)) {
          expect(d.monto).toBeGreaterThan(0);
          expect(d.deudorId).not.toBe(d.acreedorId);
        }
      }),
    );
  });
});

describe('invariantes del plan simplificado', () => {
  it('los movimientos saldan exactamente a cada persona', () => {
    fc.assert(
      fc.property(gastosArbitrarios, (gastos) => {
        const deudas = calcularDeudas(gastos, [], CASA, INTEGRANTES);
        const saldos = calcularSaldos(deudas, CASA, INTEGRANTES);

        for (const moneda of MONEDAS) {
          let n = 0;
          const movimientos = derivarMovimientos(saldos[moneda], moneda, () => `m${n++}`);

          const efecto: Record<string, number> = {};
          for (const persona of PERSONAS) efecto[persona] = 0;
          for (const m of movimientos) {
            efecto[m.deudorId] += m.monto;
            efecto[m.acreedorId] -= m.monto;
          }

          for (const persona of PERSONAS) {
            expect(saldos[moneda][persona] + efecto[persona]).toBe(0);
          }
        }
      }),
    );
  });

  it('produce a lo sumo n − 1 movimientos por moneda', () => {
    fc.assert(
      fc.property(gastosArbitrarios, (gastos) => {
        const deudas = calcularDeudas(gastos, [], CASA, INTEGRANTES);
        const saldos = calcularSaldos(deudas, CASA, INTEGRANTES);

        for (const moneda of MONEDAS) {
          let n = 0;
          const movimientos = derivarMovimientos(saldos[moneda], moneda, () => `m${n++}`);
          expect(movimientos.length).toBeLessThanOrEqual(PERSONAS.length - 1);
        }
      }),
    );
  });

  it('nadie aparece pagándose a sí mismo', () => {
    fc.assert(
      fc.property(gastosArbitrarios, (gastos) => {
        const deudas = calcularDeudas(gastos, [], CASA, INTEGRANTES);
        const saldos = calcularSaldos(deudas, CASA, INTEGRANTES);

        for (const moneda of MONEDAS) {
          let n = 0;
          for (const m of derivarMovimientos(saldos[moneda], moneda, () => `m${n++}`)) {
            expect(m.deudorId).not.toBe(m.acreedorId);
            expect(m.monto).toBeGreaterThan(0);
          }
        }
      }),
    );
  });
});
