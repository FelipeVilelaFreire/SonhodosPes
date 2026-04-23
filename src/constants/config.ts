export const APP_CONFIG = {
  MAX_AUTOCOMPLETE: 6,
  STACK_SEARCH_DEBOUNCE_MS: 150,
  TOAST_DURATION_MS: 2800,
  PIN_LENGTH: 4,

  STORAGE_KEYS: {
    CSV_URL: 'sdp:csvUrl',
    PIN_HASH: 'sdp:pinHash',
    LAST_SYNC: 'sdp:lastSync',
  },

  INDEXED_DB: {
    NAME: 'sonhodospes',
    VERSION: 1,
    STORES: {
      PRODUTOS: 'produtos',
      META: 'meta',
    },
  },

  CSV: {
    LOCAL_PATH: '/produtos.csv',
  },

  SUPABASE: {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  EXTERNAL: {
    SITE_BASE: process.env.NEXT_PUBLIC_SITE_OFICIAL_BASE || 'https://www.sonhodospesoficial.com.br',
  },
} as const;
