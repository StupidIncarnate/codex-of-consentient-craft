/**
 * PURPOSE: Names the two independent verification tracks that must each sign a unit
 *
 * USAGE:
 * signoffTrackContract.parse('flowrider');
 * // Returns: SignoffTrack enum value
 *
 * A unit is done only when BOTH tracks have signed it — Flowrider proving it at the test layer,
 * Siegemaster proving it off the running system. Neither substitutes for the other, so neither
 * verdict is allowed to stand in for the pair.
 *
 * Each track is a SEPARATE TOP-LEVEL OPTIONAL FIELD on the element it signs (`flowriderSignoff`,
 * `siegemasterSignoff`) — never a nested `signoffs` block holding both. The quest deep-merge
 * replaces nested object values wholesale, so a nested block written by one track would silently
 * delete the other track's sign-off on the very next write.
 */

import { z } from 'zod';

export const signoffTrackContract = z.enum(['flowrider', 'siegemaster']);

export type SignoffTrack = z.infer<typeof signoffTrackContract>;
