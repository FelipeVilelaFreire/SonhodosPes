export const BREAKPOINTS = {
  mobile: 380,
  tablet: 480,
  desktop: 768,
  wide: 1024,
} as const;

export const MEDIA = {
  mobileUp: `(min-width: ${BREAKPOINTS.mobile}px)`,
  tabletUp: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktopUp: `(min-width: ${BREAKPOINTS.desktop}px)`,
  wideUp: `(min-width: ${BREAKPOINTS.wide}px)`,

  mobileOnly: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  belowTablet: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  belowDesktop: `(max-width: ${BREAKPOINTS.desktop - 1}px)`,
} as const;
