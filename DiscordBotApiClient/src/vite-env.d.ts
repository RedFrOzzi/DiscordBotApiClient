interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_EXTRACT_AUDIO_URL: string;
  readonly VITE_API_UPLOAD_AUDIO_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
