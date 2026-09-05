/**
 * PURPOSE: A forensic digest reports three numbers about a session's silence: total wall-clock
 * time, time genuinely blocked on a sub-agent, and idle time with nothing running.
 * `transformers/records-to-gaps` is the only file that produces this shape. Every other contract
 * in this package describes one line, one turn, or one window. This one is the roll-up a digest
 * prints.
 *
 * USAGE:
 * gapReportContract.parse({
 *   gaps: [
 *     { gapStartedAt: '2026-09-01T19:00:00.000Z', elapsedMinutes: 0, gapSeconds: 300, liveSubagentIds: [] },
 *   ],
 *   wallClockSeconds: 300, blockedSeconds: 0, idleSeconds: 300,
 * });
 */
import { z } from 'zod';

import { turnGapContract } from '../turn-gap/turn-gap-contract';

export const gapReportContract = z
  .object({
    gaps: z.array(turnGapContract).readonly(),
    wallClockSeconds: z.number().nonnegative(),
    blockedSeconds: z.number().nonnegative(),
    idleSeconds: z.number().nonnegative(),
  })
  .brand<'GapReport'>();

export type GapReport = z.infer<typeof gapReportContract>;
