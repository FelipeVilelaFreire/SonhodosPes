export const COLORS = {
  primary: '#C8B091',
  primaryDeep: '#A88B65',
  primarySoft: '#E8DFD1',
  primaryWhisper: '#F2EBDF',

  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceWarm: '#FDFAF5',

  text: '#2B2118',
  textSoft: '#7A6B5C',
  textMuted: '#B5A794',

  success: '#7B9063',
  successSoft: '#E8EFE0',
  warning: '#C89B5E',
  warningSoft: '#F4E9D4',
  danger: '#B5574A',
  dangerSoft: '#F4E0DC',
} as const;

export type ColorKey = keyof typeof COLORS;
