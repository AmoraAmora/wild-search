import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Pure logic runs in Node; files that need a DOM opt in with `@vitest-environment happy-dom`.
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
});
