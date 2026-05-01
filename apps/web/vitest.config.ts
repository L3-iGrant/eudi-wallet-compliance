import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(here, './'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'lib/**/*.test.ts',
      'lib/__tests__/**/*.test.ts',
      'app/**/*.test.ts',
      'app/**/__tests__/**/*.test.ts',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx',
    ],
  },
});
