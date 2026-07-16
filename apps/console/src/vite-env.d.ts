/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMKP_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
