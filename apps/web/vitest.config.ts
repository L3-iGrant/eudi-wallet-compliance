import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: [
      'lib/**/*.test.ts',
      'lib/__tests__/**/*.test.ts',
      'app/**/*.test.ts',
      'app/**/__tests__/**/*.test.ts',
    ],
  },
});
