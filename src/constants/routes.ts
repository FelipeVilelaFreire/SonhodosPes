export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CATALOGO: '/catalogo',
  HISTORICO: '/historico',
  CONFIG: '/configuracoes',
} as const;

export const EXTERNAL_ROUTES = {
  SITE_OFICIAL: (codigo: string | number) =>
    `https://www.sonhodospesoficial.com.br/${codigo}`,
} as const;
