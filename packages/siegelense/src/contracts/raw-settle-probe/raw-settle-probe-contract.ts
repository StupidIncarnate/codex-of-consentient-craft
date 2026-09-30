/**
 * PURPOSE: One reading of the settle detector's page-side probe: the page's own clock, when the
 * MutationObserver last fired, and how many finite animations are running. `lastMutationAtMs` is
 * null on a document nothing has ever touched — a static page, or one probed before its first
 * render — which is genuinely quiet. Reach for SettleReading for what a wait reports; this is only
 * what one probe said.
 *
 * USAGE:
 * rawSettleProbeContract.parse({ nowMs: 1700000000000, lastMutationAtMs: null, runningAnimations: 0 });
 * // Returns the parsed probe
 */

import { z } from '#gateway/npm/zod';


export const rawSettleProbeContract = z.object({
  nowMs: z.number().int().nonnegative().brand<'RawSettleProbeNowMs'>(),
  lastMutationAtMs: z.number().int().nonnegative().brand<'RawSettleProbeLastMutationAtMs'>().nullable(),
  runningAnimations: z.number().int().nonnegative().brand<'RawSettleProbeRunningAnimations'>(),
});

export type RawSettleProbe = z.infer<typeof rawSettleProbeContract>;
