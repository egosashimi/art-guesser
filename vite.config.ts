import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// `base` is relative so the build works on GitHub Pages under /<repo>/ as well as at a domain root.
export default defineConfig({
  base: './',
  plugins: [preact()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
} as any);
