import { describe, expect, it } from 'vitest';
import { agruparPorFranja, franjaDe } from './fechas';

const AHORA = new Date('2026-07-15T10:00:00');

describe('franjaDe', () => {
  it('lo de hoy cae en "hoy", a cualquier hora', () => {
    expect(franjaDe(new Date('2026-07-15T00:05:00'), AHORA)).toBe('hoy');
    expect(franjaDe(new Date('2026-07-15T23:50:00'), AHORA)).toBe('hoy');
  });

  it('lo de ayer a última hora cae en "esta semana", no en "hoy"', () => {
    // Pasaron once horas, pero es otro día calendario: la comparación por
    // diferencia de horas diría "hoy" y sería confuso.
    expect(franjaDe(new Date('2026-07-14T23:00:00'), AHORA)).toBe('semana');
  });

  it('los últimos siete días son "esta semana"', () => {
    expect(franjaDe(new Date('2026-07-09T12:00:00'), AHORA)).toBe('semana');
  });

  it('a partir del séptimo día es "antes"', () => {
    expect(franjaDe(new Date('2026-07-08T12:00:00'), AHORA)).toBe('antes');
  });

  it('una fecha futura cuenta como "hoy" en vez de romper', () => {
    expect(franjaDe(new Date('2026-07-20T12:00:00'), AHORA)).toBe('hoy');
  });
});

describe('agruparPorFranja', () => {
  it('agrupa en orden y descarta las franjas vacías', () => {
    const items = [
      { id: 'a', fecha: '2026-07-15T09:00:00' },
      { id: 'b', fecha: '2026-06-01T09:00:00' },
      { id: 'c', fecha: '2026-07-15T08:00:00' },
    ];

    expect(agruparPorFranja(items, (i) => i.fecha, AHORA)).toEqual([
      { franja: 'hoy', etiqueta: 'Hoy', items: [items[0], items[2]] },
      { franja: 'antes', etiqueta: 'Antes', items: [items[1]] },
    ]);
  });

  it('sin elementos devuelve una lista vacía', () => {
    expect(agruparPorFranja([], () => '2026-07-15', AHORA)).toEqual([]);
  });
});
