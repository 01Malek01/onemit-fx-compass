
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
    },
    // Add middleware to diagnose module resolution issues
    middlewares: [
      (req, res, next) => {
        // Custom middleware for error detection
        return next();
      }
    ]
  },
  optimizeDeps: {
    // Force include problematic dependencies
    include: ['react', 'react-dom', '@tanstack/react-query'],
    // Disable dependency optimization during development for troubleshooting
    disabled: mode === 'development' && process.env.VITE_DEBUG_DEPS === 'true',
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
    // Add minification options to improve build reliability
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Explicitly define extensions to improve module resolution
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    // Add mainFields to help with package resolution
    mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
  },
  // Improve Vite's logging and error reporting
  clearScreen: false,
  logLevel: 'info',
}));
