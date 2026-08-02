import { describe, expect, it } from 'vitest';

/** Verifica que el arnés de tests y los alias de paths estén bien cableados.
 *  Se borra en cuanto la Fase 1 traiga tests de verdad. */
describe('arnés de tests', () => {
  it('corre', () => {
    expect(1 + 1).toBe(2);
  });
});
