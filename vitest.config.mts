import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite resuelve los paths de tsconfig de forma nativa: `@/…` funciona sin plugin.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['{features,lib,components,app,tests}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'design_handoff_saldito'],
  },
});
