import { defineConfig } from 'vitest/config';

// Lightweight unit-test harness for pure, framework-free logic (models,
// helpers). It deliberately does NOT boot Angular/TestBed — component specs,
// if added later, need a separate jsdom + Angular setup. Keep these specs
// dependency-free so they stay fast and reliable.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Exclude anything that would pull Angular at import time.
    exclude: ['**/node_modules/**', '**/*.component.spec.ts'],
  },
});
