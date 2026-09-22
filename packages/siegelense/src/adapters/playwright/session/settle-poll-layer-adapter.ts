/**
 * PURPOSE: One poll of the settle detector, and the recursion that repeats it until the page holds
 * still or the ceiling arrives. `settleWaitLayerAdapter` owns the page-side sources and the request
 * bookkeeping; this owns the DECISION — reading the probe, grading the three signals against the
 * quiet window, and either recursing or reporting. Reach for this split rather than a loop inside
 * the facade: `no-await-in-loop` forbids awaiting a probe inside a `for`, and a function that can
 * name itself is the only shape an indeterminate wait can take here.
 *
 * A signal is graded as a LEVEL, not an edge, so the reading always describes the page as it is at
 * the moment the wait ends rather than as it was when something last changed.
 *
 * The ceiling is checked AFTER the probe, so the last thing a `settled: false` reading reports is a
 * real observation of the page rather than a guess left over from the previous tick. Recursion also
 * stops on `attemptsLeft`, because `Date.now()` is not monotonic: an NTP correction mid-walk moves
 * it backwards, and a wait guarded only on elapsed time would then never end.
 *
 * USAGE:
 * await settlePollLayerAdapter({
 *   page, probeSource, quietWindowMs: 250, ceilingMs: 5000, pollMs: 50,
 *   startedAtMs: Date.now(), attemptsLeft: 102, networkSnapshot,
 * });
 * // Returns { settled: false, reason: 'ceiling', waitedMs: 5000, unsettled: ['network'], ... }
 */

import type { Page } from '@playwright/test';
import { z } from 'zod';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import { settleReadingContract } from '../../../contracts/settle-reading/settle-reading-contract';
import type { SettleReading } from '../../../contracts/settle-reading/settle-reading-contract';

// `lastMutationAtMs` is null on a document nothing has ever touched — a static page, or one probed
// before its first render. That is genuinely quiet, and is the one case where the DOM signal skips
// the quiet window rather than measuring it.
const rawSettleProbeContract = z.object({
  nowMs: epochMsContract,
  lastMutationAtMs: epochMsContract.nullable(),
  runningAnimations: readingCountContract,
});

export const settlePollLayerAdapter = async ({
  page,
  probeSource,
  quietWindowMs,
  ceilingMs,
  pollMs,
  startedAtMs,
  attemptsLeft,
  networkSnapshot,
}: {
  page: Page;
  probeSource: ContentText;
  quietWindowMs: number;
  ceilingMs: number;
  pollMs: number;
  startedAtMs: number;
  attemptsLeft: number;
  networkSnapshot: () => {
    pendingRequests: ReadingCount;
    lastActivityAtMs: EpochMs | null;
    pollersDiscounted: readonly ContentText[];
  };
}): Promise<SettleReading> => {
  const raw: unknown = await page.evaluate(probeSource);
  const probe = rawSettleProbeContract.parse(raw);
  const nowMs = Date.now();
  const network = networkSnapshot();

  const networkQuiet =
    network.pendingRequests === 0 &&
    (network.lastActivityAtMs === null || nowMs - network.lastActivityAtMs >= quietWindowMs);
  // Both halves come from the SAME probe, so this is the page's own clock on both sides — Node and
  // browser clocks drift, and a skewed comparison makes a fresh mutation read as an old one.
  const domQuiet =
    probe.lastMutationAtMs === null || probe.nowMs - probe.lastMutationAtMs >= quietWindowMs;

  const unsettled = [
    networkQuiet ? null : 'network',
    domQuiet ? null : 'dom',
    probe.runningAnimations > 0 ? 'animation' : null,
  ].filter((signal) => signal !== null);
  const waitedMs = Math.max(0, nowMs - startedAtMs);

  if (unsettled.length === 0) {
    return settleReadingContract.parse({
      settled: true,
      reason: 'quiet',
      waitedMs,
      unsettled: [],
      pendingRequests: network.pendingRequests,
      pollersDiscounted: network.pollersDiscounted,
    });
  }

  if (waitedMs >= ceilingMs || attemptsLeft <= 1) {
    return settleReadingContract.parse({
      settled: false,
      reason: 'ceiling',
      waitedMs,
      unsettled,
      pendingRequests: network.pendingRequests,
      pollersDiscounted: network.pollersDiscounted,
    });
  }

  await page.waitForTimeout(pollMs);

  return settlePollLayerAdapter({
    page,
    probeSource,
    quietWindowMs,
    ceilingMs,
    pollMs,
    startedAtMs,
    attemptsLeft: attemptsLeft - 1,
    networkSnapshot,
  });
};
