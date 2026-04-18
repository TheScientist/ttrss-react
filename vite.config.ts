import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Determine which build variant to use
const buildMode = process.env.BUILD_MODE || 'dark' // 'dark' or 'light'
const inputFile = buildMode === 'light' ? 'index-light.html' : 'index-dark.html'
const outputDir = buildMode === 'light' ? 'dist-light' : 'dist-dark'

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
    outDir: outputDir,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, inputFile),
      },
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
      thresholds: {
        lines: 35,
        functions: 30,
        branches: 60,
        statements: 35,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        'vite.config.ts',
      ],
    },
  },
})
