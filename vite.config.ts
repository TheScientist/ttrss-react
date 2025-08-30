import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api/': {
        target: 'https://thescientist.eu/tt-rss/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/public.php': {
        target: 'https://thescientist.eu/tt-rss/',
        changeOrigin: true,
      },
    },
  },

  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 70,
      //   statements: 80,
      // },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        'vite.config.ts',
      ],
    },
  },
})
