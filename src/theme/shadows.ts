export const SHADOWS = {
  sm: '0 1px 2px rgba(43, 33, 24, 0.04)',
  md: '0 4px 12px rgba(43, 33, 24, 0.06), 0 1px 3px rgba(43, 33, 24, 0.04)',
  lg: '0 12px 32px rgba(43, 33, 24, 0.08), 0 4px 12px rgba(43, 33, 24, 0.05)',
  xl: '0 24px 48px rgba(43, 33, 24, 0.12), 0 8px 16px rgba(43, 33, 24, 0.06)',
} as const;

export type ShadowKey = keyof typeof SHADOWS;
