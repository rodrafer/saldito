import { describe, expect, it } from 'vitest';
import { calcularDeudas, deudasDeGasto } from './deudas';
import { calcularSaldos } from './saldos';
import { gasto, grupo, integrantes, pago } from '@/tests/factories';

const CASA = grupo();
const TRES = integrantes(['ana', 'beto', 'caro']);

describe('deudasDeGasto', () => {
  it('con un solo pagador, cada participante le debe su parte', () => {
    const g = gasto({
      monto: 900,
      contribuciones: { ana: 900 },
      participantes: ['ana', 'beto', 'caro'],
    });

    expect(deudasDeGasto(g)).toEqual({
      beto: { ana: 300 },
      caro: { ana: 300 },
    });
  });

  it('reparte la deuda entre varios pagadores, en proporción a lo que puso cada uno', () => {
    // Ana puso 600 y Beto 400. Los tres consumen por partes iguales.
    // Cada participante le debe a cada pagador según esa proporción 60/40.
    const g = gasto({
      monto: 1000,
      modoPago: 'montos',
      contribuciones: { ana: 600, beto: 400 },
      participantes: ['ana', 'beto', 'caro'],
    });

    expect(deudasDeGasto(g)).toEqual({
      // Ana consume 334; su porción propia (200) se cancela sola.
      ana: { beto: 134 },
      // Beto consume 333; su porción propia (133) se cancela sola.
      beto: { ana: 200 },
      caro: { ana: 200, beto: 133 },
    });
  });

  it('un pagador que no participa igual cobra su parte', () => {
    const g = gasto({
      monto: 1000,
      contribuciones: { ana: 1000 },
      participantes: ['beto', 'caro'],
    });

    expect(deudasDeGasto(g)).toEqual({
      beto: { ana: 500 },
      caro: { ana: 500 },
    });
  });

  it('devuelve la matriz bruta: el neteo por par es tarea de calcularDeudas', () => {
    // Cada uno puso exactamente lo que consumió, así que el gasto no mueve
    // saldos. Pero a nivel de un gasto suelto las dos deudas siguen existiendo
    // enfrentadas: recién se cancelan al netear el par en calcularDeudas.
    const g = gasto({
      monto: 1000,
      modoPago: 'montos',
      contribuciones: { ana: 500, beto: 500 },
      modoReparto: 'montos',
      participantes: ['ana', 'beto'],
      reparto: { ana: 500, beto: 500 },
    });

    expect(deudasDeGasto(g)).toEqual({
      ana: { beto: 250 },
      beto: { ana: 250 },
    });
    expect(calcularDeudas([g], [], CASA, integrantes(['ana', 'beto']))).toEqual([]);
  });

  it('quien queda con reparto cero no debe nada', () => {
    const g = gasto({
      monto: 1000,
      contribuciones: { ana: 1000 },
      modoReparto: 'montos',
      participantes: ['ana', 'beto', 'caro'],
      reparto: { ana: 0, beto: 1000, caro: 0 },
    });

    expect(deudasDeGasto(g)).toEqual({ beto: { ana: 1000 } });
  });

  it('ignora un gasto sin monto', () => {
    expect(deudasDeGasto(gasto({ monto: 0 }))).toEqual({});
  });
});

describe('calcularDeudas', () => {
  it('netea las deudas cruzadas de un mismo par en una sola', () => {
    const gastos = [
      gasto({ monto: 200, contribuciones: { ana: 200 }, participantes: ['beto'] }),
      gasto({ monto: 60, contribuciones: { beto: 60 }, participantes: ['ana'] }),
    ];

    const deudas = calcularDeudas(gastos, [], CASA, integrantes(['ana', 'beto']));

    expect(deudas).toEqual([
      {
        deudorId: 'beto',
        acreedorId: 'ana',
        moneda: 'ARS',
        monto: 140,
        gastoIds: expect.any(Array),
      },
    ]);
  });

  it('nunca mezcla monedas: un mismo par puede deber en cada una', () => {
    const gastos = [
      gasto({ moneda: 'ARS', monto: 1000, contribuciones: { ana: 1000 }, participantes: ['beto'] }),
      gasto({ moneda: 'USD', monto: 80, contribuciones: { beto: 80 }, participantes: ['ana'] }),
    ];

    const deudas = calcularDeudas(gastos, [], CASA, integrantes(['ana', 'beto']));

    expect(deudas).toHaveLength(2);
    expect(deudas.find((d) => d.moneda === 'ARS')).toMatchObject({
      deudorId: 'beto',
      acreedorId: 'ana',
      monto: 1000,
    });
    expect(deudas.find((d) => d.moneda === 'USD')).toMatchObject({
      deudorId: 'ana',
      acreedorId: 'beto',
      monto: 80,
    });
  });

  it('cada deuda arrastra sólo los gastos de su propia moneda', () => {
    const enPesos = gasto({
      id: 'g-pesos',
      moneda: 'ARS',
      monto: 1000,
      contribuciones: { ana: 1000 },
      participantes: ['beto'],
    });
    const enDolares = gasto({
      id: 'g-dolares',
      moneda: 'USD',
      monto: 80,
      contribuciones: { beto: 80 },
      participantes: ['ana'],
    });

    const deudas = calcularDeudas([enPesos, enDolares], [], CASA, integrantes(['ana', 'beto']));

    expect(deudas.find((d) => d.moneda === 'ARS')?.gastoIds).toEqual(['g-pesos']);
    expect(deudas.find((d) => d.moneda === 'USD')?.gastoIds).toEqual(['g-dolares']);
  });

  it('los pagos registrados reducen la deuda', () => {
    const gastos = [gasto({ monto: 1000, contribuciones: { ana: 1000 }, participantes: ['beto'] })];
    const pagos = [pago({ deudorId: 'beto', acreedorId: 'ana', monto: 400 })];

    const deudas = calcularDeudas(gastos, pagos, CASA, integrantes(['ana', 'beto']));

    expect(deudas).toHaveLength(1);
    expect(deudas[0]).toMatchObject({ deudorId: 'beto', acreedorId: 'ana', monto: 600 });
  });

  it('un pago declarado sin confirmar también reduce la deuda', () => {
    const gastos = [gasto({ monto: 1000, contribuciones: { ana: 1000 }, participantes: ['beto'] })];
    const pagos = [pago({ monto: 1000, registradoPor: 'beto', confirmado: false })];

    expect(calcularDeudas(gastos, pagos, CASA, integrantes(['ana', 'beto']))).toEqual([]);
  });

  it('excluye los gastos anulados y los borradores de recurrencias', () => {
    const gastos = [
      gasto({ monto: 1000, contribuciones: { ana: 1000 }, participantes: ['beto'], anulado: true }),
      gasto({ monto: 500, contribuciones: { ana: 500 }, participantes: ['beto'], borrador: true }),
    ];

    expect(calcularDeudas(gastos, [], CASA, integrantes(['ana', 'beto']))).toEqual([]);
  });

  it('ignora los gastos de otros grupos', () => {
    const gastos = [
      gasto({
        grupoId: 'otro',
        monto: 1000,
        contribuciones: { ana: 1000 },
        participantes: ['beto'],
      }),
    ];

    expect(calcularDeudas(gastos, [], CASA, integrantes(['ana', 'beto']))).toEqual([]);
  });

  it('sigue contando las deudas de un integrante desactivado', () => {
    // Nadie se va del grupo debiendo: si sus deudas desaparecieran del cálculo,
    // la regla que bloquea la salida no tendría con qué frenarlo.
    const gastos = [gasto({ monto: 1000, contribuciones: { ana: 1000 }, participantes: ['beto'] })];
    const conInactivo = integrantes(['ana', 'beto']).map((i) =>
      i.usuarioId === 'beto'
        ? { ...i, activo: false, desactivadoEl: '2026-07-01T00:00:00.000Z' }
        : i,
    );

    const deudas = calcularDeudas(gastos, [], CASA, conInactivo);

    expect(deudas).toHaveLength(1);
    expect(deudas[0]).toMatchObject({ deudorId: 'beto', monto: 1000 });
  });

  it('descarta las deudas que se cancelan del todo', () => {
    const gastos = [
      gasto({ monto: 500, contribuciones: { ana: 500 }, participantes: ['beto'] }),
      gasto({ monto: 500, contribuciones: { beto: 500 }, participantes: ['ana'] }),
    ];

    expect(calcularDeudas(gastos, [], CASA, integrantes(['ana', 'beto']))).toEqual([]);
  });
});

describe('el ejemplo de la especificación 1.4', () => {
  // Ana pone 600, Beto 400, y los tres consumen por partes iguales.
  const g = gasto({
    monto: 1000,
    modoPago: 'montos',
    contribuciones: { ana: 600, beto: 400 },
    participantes: ['ana', 'beto', 'caro'],
  });

  it('el saldo neto coincide con puso − consumió', () => {
    const deudas = calcularDeudas([g], [], CASA, TRES);
    const saldos = calcularSaldos(deudas, CASA, TRES);

    // Ana puso 600 y consumió 334. Beto puso 400 y consumió 333.
    // Caro no puso nada y consumió 333.
    expect(saldos.ARS).toEqual({ ana: 266, beto: 67, caro: -333 });
  });

  it('los saldos del grupo suman cero', () => {
    const deudas = calcularDeudas([g], [], CASA, TRES);
    const saldos = calcularSaldos(deudas, CASA, TRES);

    expect(Object.values(saldos.ARS).reduce((a, b) => a + b, 0)).toBe(0);
  });
});
