/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: './' keeps built asset URLs relative so the same dist/ works both served
// as a website and loaded as an unpacked MV3 new-tab extension (SPEC §11).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
