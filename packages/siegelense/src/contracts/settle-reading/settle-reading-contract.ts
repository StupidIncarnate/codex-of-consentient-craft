/**
 * PURPOSE: What ONE settle wait observed — whether the page went quiet, how long the wait took,
 * and, when it did not, which of the three signals was still moving when the ceiling arrived.
 * Reach for this over a bare boolean or a bare elapsed number: "did not settle" is a real answer a
 * step has to be able to report, and it is only actionable with the signal names and the poller
 * shapes the wait discounted beside it — otherwise a walk reads an unexplained timeout and the
 * fixer cannot tell a slow page from an endless poll.
 *
 * `unsettled` is empty exactly when `settled` is true; `pollersDiscounted` is filled either way,
 * because a wait that settled BECAUSE a repeating shape was discounted is the case a reader most
 * needs to be able to audit.
 *
 * USAGE:
 * settleReadingContract.parse({
 *   settled: false,
 *   reason: 'ceiling',
 *   waitedMs: 5000,
 *   unsettled: ['network'],
 *   pendingRequests: 1,
 *   pollersDiscounted: ['GET http://localhost:3737/api/quests'],
 * });
 * // Returns a branded SettleReading
 */

import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { readingCountContract } from '../reading-count/reading-count-contract';

export const settleReadingContract = z
  .object({
    settled: z.boolean(),
    // 'quiet' — every signal held still for the whole quiet window. 'ceiling' — the wait gave up
    // and is SAYING so, which is what lets the step above report a real outcome instead of hanging.
    reason: z.enum(['quiet', 'ceiling']).brand<'SettleReason'>(),
    waitedMs: z.number().int().nonnegative().brand<'WaitedMs'>(),
    unsettled: z.array(z.enum(['network', 'dom', 'animation']).brand<'SettleSignal'>()).readonly(),
    // In-flight requests that were NOT discounted as pollers, at the moment the wait ended.
    pendingRequests: readingCountContract,
    pollersDiscounted: z.array(contentTextContract).readonly(),
  })
  .strict();

export type SettleReading = z.infer<typeof settleReadingContract>;
