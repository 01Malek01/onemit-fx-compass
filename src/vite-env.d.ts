
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG?: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    accept: Function;
    dispose: Function;
    prune: Function;
    invalidate: Function;
    on: Function;
  };
  readonly glob: (
    pattern: string,
    options?: { eager?: boolean }
  ) => Record<string, any>;
}
