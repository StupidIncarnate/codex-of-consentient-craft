/**
 * PURPOSE: The page's scroll geometry at one instant — where the viewport sits inside the
 * document and how large the document is. It is what tells a reader that a capture omits content
 * (`scrollHeight` past `viewportHeight`) and what the `scroll` step reports as its new position.
 * Reach for `BoxReading` instead when the question is one element's rectangle.
 *
 * USAGE:
 * scrollReadingContract.parse({
 *   scrollX: 0,
 *   scrollY: 400,
 *   scrollWidth: 1280,
 *   scrollHeight: 900,
 *   viewportWidth: 1280,
 *   viewportHeight: 500,
 * });
 * // Returns a validated ScrollReading
 */

import { z } from 'zod';

import { pixelCountContract } from '../pixel-count/pixel-count-contract';

export const scrollReadingContract = z
  .object({
    scrollX: pixelCountContract,
    scrollY: pixelCountContract,
    scrollWidth: pixelCountContract,
    scrollHeight: pixelCountContract,
    viewportWidth: pixelCountContract,
    viewportHeight: pixelCountContract,
  })
  .strict();

export type ScrollReading = z.infer<typeof scrollReadingContract>;
