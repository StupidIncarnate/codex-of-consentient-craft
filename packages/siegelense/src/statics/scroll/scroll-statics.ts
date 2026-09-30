/**
 * PURPOSE: The page-side source that reads scroll geometry, and the wording of the two readings
 * built from it — the cut-off note `screenshot` and `look` append, and the position `scroll`
 * reports. The read source rides the session's own `evaluateSource`, so measuring scroll needs no
 * adapter method of its own.
 *
 * USAGE:
 * scrollStatics.edges.bottom;
 * // Returns 'bottom' — the edge a `scroll` step's `to` field can name
 */

export const scrollStatics = {
  edges: {
    top: 'top',
    bottom: 'bottom',
  },
  // Self-invoked: a bare arrow-function source is never called by Playwright's evaluate, so it would
  // serialize as `undefined`. The document element carries the scroll size; `innerWidth`/`innerHeight`
  // are the viewport the capture covers.
  readSource: `(() => ({
  scrollX: Math.max(0, Math.round(window.scrollX)),
  scrollY: Math.max(0, Math.round(window.scrollY)),
  scrollWidth: Math.max(0, Math.round(document.documentElement.scrollWidth)),
  scrollHeight: Math.max(0, Math.round(document.documentElement.scrollHeight)),
  viewportWidth: Math.max(0, Math.round(window.innerWidth)),
  viewportHeight: Math.max(0, Math.round(window.innerHeight)),
}))()`,
  cutoff: {
    prefix: 'CUT OFF — ',
    tall: 'page {size}px tall',
    wide: 'page {size}px wide',
    above: '{amount}px above the viewport',
    below: '{amount}px below the viewport',
    left: '{amount}px left of the viewport',
    right: '{amount}px right of the viewport',
    separator: '; ',
  },
  position: {
    template:
      'scroll position x={x} y={y}; page {pageWidth}x{pageHeight}; viewport {viewportWidth}x{viewportHeight}; max scroll x={maxX} y={maxY}',
  },
} as const;
