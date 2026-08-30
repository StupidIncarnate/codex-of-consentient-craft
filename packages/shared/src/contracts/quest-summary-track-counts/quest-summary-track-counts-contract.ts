/**
 * PURPOSE: One verification track's coverage of ONE flow — how many of that track's eligible units
 * it confirmed, how many it recorded as unconfirmable, and how many it has not signed at all
 *
 * USAGE:
 * questSummaryTrackCountsContract.parse({
 *   id: 'flowrider',
 *   confirmed: 12,
 *   unconfirmable: 1,
 *   outstanding: 3,
 * });
 * // Returns: QuestSummaryTrackCounts — one element of QuestSummaryFlow.tracks[]
 *
 * THE THREE COUNTS PARTITION THAT TRACK'S DENOMINATOR, and the denominator is NOT the flow's whole
 * unit set. `signoffTrackEligibilityStatics` removes the unit kinds and the observable origins a
 * track could never have signed — an observable Siegemaster added mid-walk is outside Flowrider's
 * denominator entirely, so it is absent from all three numbers rather than sitting in `outstanding`
 * as a hole no Flowrider session could ever close.
 *
 * `id` IS THE DENOMINATOR TRACK, NOT THE SIGN-OFF FIELD. A row per field would fuse into one number
 * the work of every role that writes that field, and no single role's own work list computes it.
 * Keyed on the denominator, each row narrows by its own package kinds and the rows partition the
 * flow's units between them.
 *
 * `tracks` is an id-bearing array rather than a `Record<SignoffDenominatorTrack, …>`. Every other
 * per-key collection on a quest is an id-bearing array for the same reason: the quest deep-merge
 * upserts array elements by `id` and replaces a plain object value wholesale, and a reader that
 * maps over `tracks` keeps working when a further denominator lands.
 *
 * There is deliberately no `total`: it is `confirmed + unconfirmable + outstanding` by construction,
 * and a stored total is a second source of truth that can disagree with the three it summarises.
 */

import { z } from 'zod';

import { signoffDenominatorTrackContract } from '../signoff-denominator-track/signoff-denominator-track-contract';

const signoffUnitCountContract = z.number().int().nonnegative().brand<'SignoffUnitCount'>();

export const questSummaryTrackCountsContract = z.object({
  id: signoffDenominatorTrackContract,
  confirmed: signoffUnitCountContract
    .default(0)
    .describe('Units this track signed `confirmed` — proven, with the evidence recorded.'),
  unconfirmable: signoffUnitCountContract
    .default(0)
    .describe(
      'Units this track signed `unconfirmable` — settled, not proven. They only surface here and in `QuestSummary.unconfirmable`.',
    ),
  outstanding: signoffUnitCountContract
    .default(0)
    .describe(
      "Units in this track's denominator carrying NO sign-off from it — this track's work list. Nothing refuses a `done` over it.",
    ),
});

export type QuestSummaryTrackCounts = z.infer<typeof questSummaryTrackCountsContract>;
