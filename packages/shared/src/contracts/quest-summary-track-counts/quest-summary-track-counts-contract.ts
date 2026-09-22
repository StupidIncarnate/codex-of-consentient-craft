/**
 * PURPOSE: One verification track's tally over ONE flow — how many of that track's eligible units
 * hold, how many it cannot settle, how many it looked at and left open, and how many nobody has
 * marked at all. Reach for this when you need a single track's numbers; `questSummaryFlowContract`
 * is the flow row that carries one of these per track that measures it.
 *
 * USAGE:
 * questSummaryTrackCountsContract.parse({
 *   id: 'flowrider',
 *   met: 12,
 *   cantMeet: 1,
 *   unmet: 2,
 *   outstanding: 3,
 * });
 * // Returns: QuestSummaryTrackCounts — one element of QuestSummaryFlow.tracks[]
 *
 * THE FOUR COUNTS PARTITION THAT TRACK'S DENOMINATOR, and the denominator is NOT the flow's whole
 * unit set. `stepScopeStatics` (`packages/orchestrator/src/statics/step-scope`) declares, per family
 * and step, the flow types, verification methods, unit kinds, package types and observable origins
 * in scope; everything outside them is absent from all four numbers. An observable Siegemaster adds
 * mid-walk never enters Flowrider's denominator, so it never sits in `outstanding` as a hole no
 * Flowrider session could close.
 *
 * `unmet` AND `outstanding` ARE DIFFERENT FACTS AND NEVER MERGE. `unmet` is a session that looked at
 * the unit and left work open; `outstanding` is a unit no session of this track has marked at all.
 * One has a verdict behind it and the other has nobody, and a reader deciding what to pick up needs
 * the two apart.
 *
 * COUNTS ATTRIBUTE PER TRACK. A row tallies only the observations written by work items of its OWN
 * track: a unit a codeweaver session marked `met` leaves flowrider's row untouched. Two tracks
 * produce two independent marks on the same unit and neither settles the other's.
 *
 * `id` NAMES THE DENOMINATOR — which units this row is measured over — so each row narrows by its
 * own step scope and the rows partition the flow's units between them.
 *
 * `tracks` is an id-bearing array rather than a `Record<SignoffDenominatorTrack, …>`. Every other
 * per-key collection on a quest is an id-bearing array for the same reason: the quest deep-merge
 * upserts array elements by `id` and replaces a plain object value wholesale, and a reader that
 * maps over `tracks` keeps working when a further denominator lands.
 *
 * There is deliberately no `total`: it is `met + cantMeet + unmet + outstanding` by construction,
 * and a stored total is a second source of truth that can disagree with the four it summarises.
 *
 * `.strict()`, AND THAT IS WHAT MAKES THE FOUR COUNTS HONEST. Its only producer builds this row as
 * an object literal handed to `.parse()`, which takes `unknown` — so TypeScript grades nothing at
 * that call site. Without `.strict()` a count renamed here and missed there would be STRIPPED, each
 * of the four would fall back to its `.default(0)`, and the row would render as a fully zeroed
 * track with nothing anywhere reporting a fault.
 */

import { z } from 'zod';

import { signoffDenominatorTrackContract } from '../signoff-denominator-track/signoff-denominator-track-contract';

const trackUnitCountContract = z.number().int().nonnegative().brand<'TrackUnitCount'>();

export const questSummaryTrackCountsContract = z
  .object({
    id: signoffDenominatorTrackContract,
    met: trackUnitCountContract
      .default(0)
      .describe(
        "Units in THIS track's denominator that a work item of THIS track marked `met` — settled, it holds. A `met` another track wrote on the same unit belongs to that track's row and is excluded from this one.",
      ),
    cantMeet: trackUnitCountContract
      .default(0)
      .describe(
        "Units in THIS track's denominator that a work item of THIS track marked `cant-meet` — settled, because this layer genuinely cannot confirm them. Settled is not proven: each one is carried whole in the summary's debt list, the only place its evidence and its next action surface. Excludes what another track could not meet.",
      ),
    unmet: trackUnitCountContract
      .default(0)
      .describe(
        "Units in THIS track's denominator that a work item of THIS track marked `unmet` — NOT settled: work is outstanding right now and a successor is minted for exactly these. Never folded into `outstanding`, because a session looked at these and left them open. Excludes what another track left unmet.",
      ),
    outstanding: trackUnitCountContract
      .default(0)
      .describe(
        "Units in THIS track's denominator carrying NO mark from this track at all — nobody has looked yet. This is the track's work list, and nothing refuses a `done` over it. Excludes every unit outside this track's step scope, which is not in the denominator to begin with.",
      ),
  })
  .strict();

export type QuestSummaryTrackCounts = z.infer<typeof questSummaryTrackCountsContract>;
