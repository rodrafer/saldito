import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { repartirEnPartesIguales, repartirMatriz, repartirProporcional } from './redondeo';
import { particion, suma } from '@/tests/factories';

describe('repartirEnPartesIguales', () => {
  it('divide exacto cuando el monto es múltiplo de la cantidad de personas', () => {
    expect(repartirEnPartesIguales(900, ['ana', 'beto', 'caro'])).toEqual({
      ana: 300,
      beto: 300,
      caro: 300,
    });
  });

  it('asigna el sobrante de a una unidad, en orden de lista', () => {
    // 1000 / 3 = 333,33: sobran 1, y van a los primeros de la lista.
    expect(repartirEnPartesIguales(1000, ['ana', 'beto', 'caro'])).toEqual({
      ana: 334,
      beto: 333,
      caro: 333,
    });
  });

  it('devuelve vacío sin personas, en vez de dividir por cero', () => {
    expect(repartirEnPartesIguales(1000, [])).toEqual({});
  });

  it('la suma siempre cierra exacto contra el total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
        (total, ids) => {
          expect(suma(repartirEnPartesIguales(total, ids))).toBe(total);
        },
      ),
    );
  });

  it('nadie se lleva más de una unidad de diferencia respecto de otro', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
        (total, ids) => {
          const partes = Object.values(repartirEnPartesIguales(total, ids));
          expect(Math.max(...partes) - Math.min(...partes)).toBeLessThanOrEqual(1);
        },
      ),
    );
  });
});

describe('repartirProporcional', () => {
  it('reparte según el peso de cada uno', () => {
    expect(
      repartirProporcional(1000, [
        { id: 'ana', peso: 75 },
        { id: 'beto', peso: 25 },
      ]),
    ).toEqual({ ana: 750, beto: 250 });
  });

  it('da el sobrante a quien tenía la mayor parte fraccionaria', () => {
    // 100 repartido en tres partes iguales: 33,33 cada uno. Todas empatan en
    // parte fraccionaria, así que gana el primero por orden estable.
    const out = repartirProporcional(100, [
      { id: 'ana', peso: 1 },
      { id: 'beto', peso: 1 },
      { id: 'caro', peso: 1 },
    ]);
    expect(out).toEqual({ ana: 34, beto: 33, caro: 33 });
  });

  it('es indiferente a la escala de los pesos', () => {
    const conPorcentajes = repartirProporcional(7777, [
      { id: 'ana', peso: 30 },
      { id: 'beto', peso: 70 },
    ]);
    const conMontos = repartirProporcional(7777, [
      { id: 'ana', peso: 3000 },
      { id: 'beto', peso: 7000 },
    ]);
    expect(conPorcentajes).toEqual(conMontos);
  });

  it('cae a partes iguales cuando todos los pesos son cero', () => {
    expect(
      repartirProporcional(10, [
        { id: 'ana', peso: 0 },
        { id: 'beto', peso: 0 },
      ]),
    ).toEqual({ ana: 5, beto: 5 });
  });

  it('quien tiene peso cero no recibe nada', () => {
    const out = repartirProporcional(1000, [
      { id: 'ana', peso: 100 },
      { id: 'beto', peso: 0 },
    ]);
    expect(out).toEqual({ ana: 1000, beto: 0 });
  });

  it('la suma siempre cierra exacto contra el total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 8, maxLength: 8 }),
        (total, ids, pesosRaw) => {
          const pesos = ids.map((id, i) => ({ id, peso: pesosRaw[i] ?? 0 }));
          expect(suma(repartirProporcional(total, pesos))).toBe(total);
        },
      ),
    );
  });

  it('nunca asigna montos negativos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 6 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 6, maxLength: 6 }),
        (total, ids, pesosRaw) => {
          const pesos = ids.map((id, i) => ({ id, peso: pesosRaw[i] ?? 0 }));
          for (const monto of Object.values(repartirProporcional(total, pesos))) {
            expect(monto).toBeGreaterThanOrEqual(0);
          }
        },
      ),
    );
  });
});

describe('repartirMatriz', () => {
  it('reparte proporcional cuando la división es exacta', () => {
    const m = repartirMatriz(
      [
        { id: 'p1', total: 600 },
        { id: 'p2', total: 400 },
      ],
      [
        { id: 'c1', total: 500 },
        { id: 'c2', total: 500 },
      ],
    );

    expect(m).toEqual({
      p1: { c1: 300, c2: 300 },
      p2: { c1: 200, c2: 200 },
    });
  });

  it('mantiene las columnas exactas aunque haya empates de redondeo', () => {
    // El caso que rompía el invariante: dos personas que ponen y consumen lo
    // mismo. Redondeando fila por fila aparecía una deuda de una unidad.
    const m = repartirMatriz(
      [
        { id: 'caro', total: 1 },
        { id: 'dani', total: 1 },
      ],
      [
        { id: 'caro', total: 1 },
        { id: 'dani', total: 1 },
      ],
    );

    expect(m.caro.caro + m.dani.caro).toBe(1); // columna de caro
    expect(m.caro.dani + m.dani.dani).toBe(1); // columna de dani
  });

  it('una columna con total cero no recibe nada', () => {
    const m = repartirMatriz(
      [{ id: 'p1', total: 100 }],
      [
        { id: 'c1', total: 100 },
        { id: 'c2', total: 0 },
      ],
    );

    expect(m.p1).toEqual({ c1: 100, c2: 0 });
  });

  it('las filas y las columnas cierran exactas contra sus totales', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        (total, nFilas, nColumnas, cortesFilas, cortesColumnas) => {
          const filas = particion(total, nFilas, cortesFilas).map((t, i) => ({
            id: `f${i}`,
            total: t,
          }));
          const columnas = particion(total, nColumnas, cortesColumnas).map((t, j) => ({
            id: `c${j}`,
            total: t,
          }));

          const m = repartirMatriz(filas, columnas);

          for (const f of filas) {
            expect(suma(m[f.id])).toBe(f.total);
          }
          for (const c of columnas) {
            const columna = filas.reduce((acc, f) => acc + m[f.id][c.id], 0);
            expect(columna).toBe(c.total);
          }
        },
      ),
    );
  });

  it('nunca produce celdas negativas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        (total, nFilas, nColumnas, cortesFilas, cortesColumnas) => {
          const filas = particion(total, nFilas, cortesFilas).map((t, i) => ({
            id: `f${i}`,
            total: t,
          }));
          const columnas = particion(total, nColumnas, cortesColumnas).map((t, j) => ({
            id: `c${j}`,
            total: t,
          }));

          for (const fila of Object.values(repartirMatriz(filas, columnas))) {
            for (const celda of Object.values(fila)) {
              expect(celda).toBeGreaterThanOrEqual(0);
            }
          }
        },
      ),
    );
  });
});
