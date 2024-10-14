interface ImportMetaEnv {
  readonly VITE_BASE_URL_WEB_APP: string
  readonly VITE_BASE_URL_APP_SERVICE_API: string
  readonly VITE_KINDE_DOMAIN: string
  readonly VITE_KINDE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
