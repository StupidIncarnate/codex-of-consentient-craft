/**
 * PURPOSE: Viewport widths at which the header logo gives up its sprites and then shrinks its ASCII
 * art, with the font sizes it shrinks to. Read by the global CSS in AppRootWidget, the only place a
 * media query can live in this package.
 *
 * USAGE:
 * logoStatics.breakpoints.hideSpritesMaxPx;
 * // 619 - the sprites hide at this viewport width and narrower
 */

export const logoStatics = {
  breakpoints: {
    hideSpritesMaxPx: 619,
    smallAsciiMaxPx: 519,
    tinyAsciiMaxPx: 419,
  },
  fontSizes: {
    smallAsciiPx: 5,
    tinyAsciiPx: 4,
  },
} as const;
