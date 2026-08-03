import { describe, expect, it } from 'vitest';
import { pagosDeMovimientos, puedeAnularPago } from './pagos';
import { pago } from '@/tests/factories';
import type { Movimiento } from '@/types';

const REGISTRADO = '2026-07-10T12:00:00.000Z';

describe('puedeAnularPago', () => {
  const p = pago({ fecha: REGISTRADO, registradoPor: 'ana' });

  it('lo puede anular quien lo registró, dentro de las 24hs', () => {
    expect(puedeAnularPago(p, 'ana', new Date('2026-07-10T20:00:00.000Z'))).toBe(true);
  });

  it('no lo puede anular otra persona', () => {
    expect(puedeAnularPago(p, 'beto', new Date('2026-07-10T20:00:00.000Z'))).toBe(false);
  });

  it('pasadas las 24hs ya no se puede', () => {
    expect(puedeAnularPago(p, 'ana', new Date('2026-07-11T12:00:01.000Z'))).toBe(false);
  });

  it('justo en el límite de las 24hs ya no se puede', () => {
    expect(puedeAnularPago(p, 'ana', new Date('2026-07-11T12:00:00.000Z'))).toBe(false);
  });
});

describe('pagosDeMovimientos', () => {
  const movimientos: Movimiento[] = [
    {
      id: 'm1',
      deudorId: 'beto',
      acreedorId: 'ana',
      moneda: 'ARS',
      monto: 500,
      hecho: true,
      hechoPor: 'ana',
      hechoEl: REGISTRADO,
    },
    { id: 'm2', deudorId: 'caro', acreedorId: 'ana', moneda: 'ARS', monto: 300, hecho: false },
  ];

  it('sólo convierte los movimientos marcados como hechos', () => {
    const pagos = pagosDeMovimientos(movimientos, 'g1', () => 'p1');

    expect(pagos).toEqual([
      {
        id: 'p1',
        grupoId: 'g1',
        deudorId: 'beto',
        acreedorId: 'ana',
        moneda: 'ARS',
        monto: 500,
        fecha: REGISTRADO,
        registradoPor: 'ana',
        confirmado: true,
      },
    ]);
  });

  it('los pagos de un plan quedan confirmados: los marcó una de las dos partes', () => {
    const pagos = pagosDeMovimientos(movimientos, 'g1', () => 'p1');
    expect(pagos[0].confirmado).toBe(true);
  });
});
