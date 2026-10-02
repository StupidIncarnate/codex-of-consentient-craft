/**
 * PURPOSE: The fields of siegelense's `cleanup` JSON answer this package actually reads, to
 * classify a `sweepIn`/`sweepOut` step. The orchestrator cannot import `@dungeonmaster/siegelense`
 * — that package lists `@dungeonmaster/cli` in its own dependencies, and `@dungeonmaster/cli`
 * lists `@dungeonmaster/orchestrator`, so importing siegelense's own `cleanupAnswerContract` here
 * would close the cycle `orchestrator → siegelense → cli → orchestrator`. This is a narrower,
 * independently-owned mirror of the shape the spawned `dungeonmaster siegelense cleanup --json`
 * call prints — not `.strict()`, on purpose: it parses another package's evolving JSON output, and
 * a field this package does not read yet (`freedMB`, `leftAlone`) should not fail this parse the
 * day siegelense adds one.
 *
 * USAGE:
 * cleanupCliAnswerContract.parse({
 *   reaped: [{ id: 'inst_9b2c' }],
 *   portsReleased: [41345],
 *   lockReleased: true,
 *   assetsAged: { instances: 3 },
 * });
 * // Returns a validated CleanupCliAnswer
 */

import { z } from '#gateway/npm/zod';

export const cleanupCliAnswerContract = z
  .object({
    reaped: z.array(z.json()),
    portsReleased: z.array(z.json()),
    lockReleased: z.boolean().optional(),
    lockReleaseOutcome: z.enum(['released', 'none-held', 'failed']).optional(),
    assetsAged: z
      .object({
        instances: z.number().int().nonnegative().brand<'CleanupCliAnswerAssetsAgedInstances'>(),
      })
      .brand<'CleanupCliAnswerAssetsAged'>(),
  })
  .refine((data) => data.lockReleased !== undefined || data.lockReleaseOutcome !== undefined, {
    message: 'Expected lockReleased or lockReleaseOutcome',
  })
  .brand<'CleanupCliAnswer'>();

export type CleanupCliAnswer = z.infer<typeof cleanupCliAnswerContract>;
