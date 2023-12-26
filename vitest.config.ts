import path from 'path';
import { defineConfig } from 'vitest/config';
import { name } from './package.json';

export default defineConfig({
  esbuild: {
    jsxInject: "import React from 'react'",
  },
  test: {
    setupFiles: './tests/test-setup.ts',
    environment: 'jsdom',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
      [name]: path.resolve(__dirname, './src'),
    },
    coverage: {
      reporter: ['text', 'text-summary', 'json', 'lcov'],
    },
  },
});
