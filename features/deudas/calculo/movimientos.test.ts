import { describe, expect, it } from 'vitest';
import { derivarMovimientos, derivarMovimientosDelGrupo } from './movimientos';

/** Ids predecibles, para poder comparar el resultado completo. */
function idsSecuenciales() {
  let n = 0;
  return () => `m${n++}`;
}

describe('derivarMovimientos', () => {
  it('resuelve un caso simple con un solo pago', () => {
    expect(derivarMovimientos({ ana: 500, beto: -500 }, 'ARS', idsSecuenciales())).toEqual([
      { id: 'm0', deudorId: 'beto', acreedorId: 'ana', moneda: 'ARS', monto: 500, hecho: false },
    ]);
  });

  it('el que más debe le paga al que más le deben', () => {
    // Caro debe 800, Dani debe 200. Ana tiene a favor 700, Beto 300.
    const movimientos = derivarMovimientos(
      { ana: 700, beto: 300, caro: -800, dani: -200 },
      'ARS',
      idsSecuenciales(),
    );

    expect(
      movimientos.map(({ deudorId, acreedorId, monto }) => ({ deudorId, acreedorId, monto })),
    ).toEqual([
      { deudorId: 'caro', acreedorId: 'ana', monto: 700 },
      { deudorId: 'caro', acreedorId: 'beto', monto: 100 },
      { deudorId: 'dani', acreedorId: 'beto', monto: 200 },
    ]);
  });

  it('no genera movimientos cuando están todos a mano', () => {
    expect(derivarMovimientos({ ana: 0, beto: 0 }, 'ARS', idsSecuenciales())).toEqual([]);
  });

  it('produce a lo sumo n − 1 movimientos', () => {
    const movimientos = derivarMovimientos(
      { ana: 300, beto: 100, caro: -150, dani: -250 },
      'ARS',
      idsSecuenciales(),
    );

    expect(movimientos.length).toBeLessThanOrEqual(3);
  });
});

describe('derivarMovimientosDelGrupo', () => {
  it('resuelve cada moneda por separado, sin compensar una con otra', () => {
    const movimientos = derivarMovimientosDelGrupo(
      {
        ARS: { ana: 1000, beto: -1000 },
        USD: { ana: -50, beto: 50 },
      },
      idsSecuenciales(),
    );

    expect(movimientos).toHaveLength(2);
    expect(movimientos.find((m) => m.moneda === 'ARS')).toMatchObject({
      deudorId: 'beto',
      acreedorId: 'ana',
      monto: 1000,
    });
    expect(movimientos.find((m) => m.moneda === 'USD')).toMatchObject({
      deudorId: 'ana',
      acreedorId: 'beto',
      monto: 50,
    });
  });
});
