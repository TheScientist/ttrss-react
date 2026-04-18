import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Determine which build variant to use
const buildMode = process.env.BUILD_MODE || 'dark' // 'dark' or 'light'
const inputFile = buildMode === 'light' ? 'index-light.html' : 'index-dark.html'
const outputDir = buildMode === 'light' ? 'dist-light' : 'dist-dark'

// Plugin to serve the correct HTML file for the selected theme
const serveThemePlugin = {
  name: 'serve-theme',
  apply: 'serve' as const,
  config() {
    // Copy the correct HTML file to index.html before dev server starts
    const srcPath = path.resolve(__dirname, inputFile);
    const destPath = path.resolve(__dirname, 'index.html');
    try {
      const content = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(destPath, content, 'utf-8');
      console.log(`\n✓ Serving ${inputFile} theme\n`);
    } catch (err) {
      console.error(`Failed to copy ${inputFile}:`, err);
    }
  },
  transformIndexHtml: {
    order: 'pre' as const,
    handler: (html: string) => {
      // Also transform to serve fresh content
      const srcPath = path.resolve(__dirname, inputFile);
      try {
        return fs.readFileSync(srcPath, 'utf-8');
      } catch (err) {
        console.error('Failed to read HTML:', err);
        return html;
      }
    },
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    middlewareMode: false,
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

  plugins: [serveThemePlugin, react()],
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
