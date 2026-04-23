export const EASING = {
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
} as const;

export const DURATION = {
  fast: '150ms',
  base: '250ms',
  slow: '400ms',
  slower: '600ms',
} as const;
