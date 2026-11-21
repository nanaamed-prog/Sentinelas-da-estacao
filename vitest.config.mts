import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
