/**
 * PURPOSE: The stacking value a pinned expandable header paints at. Reach for this over a bare
 * number so the floor is enforced where the value is produced rather than at each of the three call
 * sites — a header that lands at or below zero disappears behind its own container's background at
 * exactly the moment it pins, which reads as "sticky is broken" rather than as a stacking bug.
 *
 * USAGE:
 * stickyZIndexContract.parse(69);
 * // Returns a branded StickyZIndex
 */

import { z } from 'zod';

import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';

export const stickyZIndexContract = z
  .number()
  .int()
  .min(stickyHeaderStatics.zIndexFloor)
  .brand<'StickyZIndex'>();

export type StickyZIndex = z.infer<typeof stickyZIndexContract>;
