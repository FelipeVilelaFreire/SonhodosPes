export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof RADIUS;
