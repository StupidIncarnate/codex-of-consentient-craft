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
 * cleanupAnswerContract.parse({
 *   reaped: [{ id: 'inst_9b2c' }],
 *   portsReleased: [41345],
 *   lockReleased: true,
 *   assetsAged: { instances: 3 },
 * });
 * // Returns a validated CleanupAnswer
 */

import { z } from 'zod';

export const cleanupAnswerContract = z.object({
  reaped: z.array(z.unknown()),
  portsReleased: z.array(z.unknown()),
  lockReleased: z.boolean(),
  assetsAged: z.object({
    instances: z.number().int().nonnegative().brand<'CleanupAgedInstanceCount'>(),
  }),
});

export type CleanupAnswer = z.infer<typeof cleanupAnswerContract>;
