/**
 * PURPOSE: The whole `cleanup {}` answer — reaping by staleness, port release, lock release,
 * `assetsAged` and `leftAlone` (spec lines 2444-2450). `assetsAged` carries `instances` and
 * `freedMB` and nothing else: the spec's longer example at line 1407 also shows `videoFirst: true`,
 * but `assetsAgeLayerBroker` folds its video-window pass and its default-window pass into that SAME
 * count and size rather than reporting either by kind, so there is no separate figure to carry. It
 * is a nested object rather than two flat fields because a reader asks one question of it —
 * "did this call touch any evidence" — and two sibling keys would let a caller read the count
 * without the size. `.strict()` on purpose: a field silently accepted is a field nothing renders.
 * Reach for this over building the five parts ad hoc: this is the one shape both
 * `cleanupAnswerRenderTransformer` and `dungeonmaster siegelense cleanup`'s JSON render from.
 *
 * USAGE:
 * cleanupAnswerContract.parse({
 *   reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33812, 33840], homeRemoved: true }],
 *   portsReleased: [41345, 34173],
 *   lockReleased: true,
 *   assetsAged: { instances: 3, freedMB: 1840 },
 *   leftAlone: [{ id: 'inst_7f3a', why: 'live — last beat 2s ago' }],
 * });
 * // Returns a validated CleanupAnswer
 */

import { z } from '#gateway/npm/zod';

import { leftAloneContract } from '../left-alone/left-alone-contract';
import { reapedInstanceContract } from '../reaped-instance/reaped-instance-contract';

export const cleanupAnswerContract = z
  .object({
    reaped: z.array(reapedInstanceContract).readonly(),
    portsReleased: z
      .array(z.number().int().min(1).max(65_535).brand<'CleanupAnswerPortsReleased'>())
      .readonly(),
    lockReleased: z.boolean(),
    assetsAged: z
      .object({
        instances: z.number().int().nonnegative().brand<'CleanupAnswerAssetsAgedInstances'>(),
        freedMB: z.number().int().nonnegative().brand<'CleanupAnswerAssetsAgedFreedMB'>(),
      })
      .strict()
      .brand<'CleanupAnswerAssetsAged'>(),
    leftAlone: z.array(leftAloneContract).readonly(),
  })
  .strict()
  .brand<'CleanupAnswer'>();

export type CleanupAnswer = z.infer<typeof cleanupAnswerContract>;
