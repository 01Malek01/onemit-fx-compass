
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Improve error handling for module resolution
    hmr: {
      overlay: true,
    },
    watch: {
      // Increase time between file change detection attempts
      usePolling: true,
      interval: 1000,
    }
  },
  build: {
    // Improve Vite's chunking strategy
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Put large dependencies in separate chunks
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            return 'vendor'; // all other dependencies
          }
        }
      }
    },
    sourcemap: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Explicitly define extensions to improve module resolution
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  // Improve Vite's logging and error reporting
  clearScreen: false,
  logLevel: 'info',
}));
