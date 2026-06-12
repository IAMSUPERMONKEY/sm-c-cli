import { defineConfig } from 'tsup';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  dts: true,
  sourcemap: false,
  clean: true,
  shims: false,
  banner: { js: '#!/usr/bin/env node' },
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      '@': resolve(here, 'src'),
    };
  },
});
