import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    mdx(await import('./source.config')),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
      },
      pages: [
        { path: '/api/search' },
        {
          path: '/llms.txt',
          prerender: { enabled: true, outputPath: '/llms.txt' },
        },
        {
          path: '/llms-full.txt',
          prerender: { enabled: true, outputPath: '/llms-full.txt' },
        },
      ],
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
