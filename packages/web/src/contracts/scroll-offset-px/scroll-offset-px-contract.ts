/**
 * PURPOSE: A SIGNED distance from a scrollport's top edge to something inside it, which goes
 * negative the moment that thing scrolls above the fold. Reach for this over
 * `scrollPositionPxContract` whenever the value is a measurement rather than a scrollTop — that one
 * is `.nonnegative()` and would throw on exactly the readings this exists to carry, which is the
 * whole reason the two are separate types over the same unit.
 *
 * USAGE:
 * scrollOffsetPxContract.parse(-120);
 * // Returns ScrollOffsetPx branded number — an anchor 120px above the scrollport's top edge
 */

import { z } from 'zod';

export const scrollOffsetPxContract = z.number().brand<'ScrollOffsetPx'>();

export type ScrollOffsetPx = z.infer<typeof scrollOffsetPxContract>;
