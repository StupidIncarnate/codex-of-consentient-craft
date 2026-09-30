/**
 * PURPOSE: A session that stops emitting turns looks the same in the raw transcript whether it's
 * blocked on a sub-agent doing real work or genuinely stalled. One quest's transcript was measured
 * by hand to settle that distinction. Doing so moved the headline idle number from 67-94% down to
 * about 1% true dead air. The rest was reclassified as serialisation. `liveSubagentIds` is the
 * field that tells the two apart. An empty array means nothing was running.
 *
 * USAGE:
 * turnGapContract.parse({
 *   gapStartedAt: '2026-09-01T19:09:06.542Z', elapsedMinutes: 42.5, gapSeconds: 180,
 *   liveSubagentIds: ['agent-abc', 'agent-def'],
 * });
 */
import { z } from '#gateway/npm/zod';

import { agentContract } from '@dungeonmaster/shared/contracts';

export const turnGapContract = z
  .object({
    gapStartedAt: z.iso.datetime().brand<'TurnGapGapStartedAt'>(),
    elapsedMinutes: z.number().nonnegative().brand<'TurnGapElapsedMinutes'>(),
    gapSeconds: z.number().nonnegative().brand<'TurnGapGapSeconds'>(),
    liveSubagentIds: z.array(agentContract.shape.id).default([]),
  })
  .brand<'TurnGap'>();

export type TurnGap = z.infer<typeof turnGapContract>;
