/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_NAME: string
  readonly VITE_REPO_NAME: string
  readonly VITE_VERDENT_PR_REVIEW_URL: string
  readonly VITE_VERDENT_THREAT_MODEL_URL: string
  readonly VITE_AUTO_OPEN_VERDENT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
