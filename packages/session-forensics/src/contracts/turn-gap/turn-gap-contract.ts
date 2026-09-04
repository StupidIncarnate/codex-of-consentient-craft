/**
 * PURPOSE: A session that stops emitting turns looks identical in the raw transcript whether it is
 * blocked on a sub-agent doing real work or genuinely stalled. Measured by hand across one quest,
 * settling that distinction moved the headline idle number from 67-94% down to about 1% true dead
 * air, with the rest reclassified as serialisation. `liveSubagentIds` is the field that tells the two
 * apart: empty means nothing was running.
 *
 * USAGE:
 * turnGapContract.parse({
 *   gapStartedAt: '2026-09-01T19:09:06.542Z', elapsedMinutes: 42.5, gapSeconds: 180,
 *   liveSubagentIds: ['agent-abc', 'agent-def'],
 * });
 */
import { z } from 'zod';

import { agentIdContract } from '@dungeonmaster/shared/contracts';

export const turnGapContract = z
  .object({
    gapStartedAt: z.string().datetime().brand<'TurnGapStartedAt'>(),
    elapsedMinutes: z.number().nonnegative(),
    gapSeconds: z.number().nonnegative(),
    liveSubagentIds: z.array(agentIdContract).default([]),
  })
  .brand<'TurnGap'>();

export type TurnGap = z.infer<typeof turnGapContract>;
