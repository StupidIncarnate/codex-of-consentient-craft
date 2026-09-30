/**
 * PURPOSE: Renders the `scroll` step's reading — the position the page ended at, with the page and
 * viewport sizes and the furthest each axis can scroll, so the next step knows whether it is at an
 * edge. Reach for `scrollCutoffRenderTransformer` for the note a capture carries.
 *
 * USAGE:
 * scrollReadingRenderTransformer({ reading: ScrollReadingStub({ scrollY: 400, scrollHeight: 900, viewportHeight: 500 }) });
 * // Returns 'scroll position x=0 y=400; page 1280x900; viewport 1280x500; max scroll x=0 y=400'
 */

import type { ScrollReading } from '../../contracts/scroll-reading/scroll-reading-contract';
import { scrollStatics } from '../../statics/scroll/scroll-statics';

export const scrollReadingRenderTransformer = ({ reading }: { reading: ScrollReading }): string =>
  scrollStatics.position.template
    .replace('{x}', String(reading.scrollX))
    .replace('{y}', String(reading.scrollY))
    .replace('{pageWidth}', String(reading.scrollWidth))
    .replace('{pageHeight}', String(reading.scrollHeight))
    .replace('{viewportWidth}', String(reading.viewportWidth))
    .replace('{viewportHeight}', String(reading.viewportHeight))
    .replace('{maxX}', String(Math.max(0, reading.scrollWidth - reading.viewportWidth)))
    .replace('{maxY}', String(Math.max(0, reading.scrollHeight - reading.viewportHeight)));
