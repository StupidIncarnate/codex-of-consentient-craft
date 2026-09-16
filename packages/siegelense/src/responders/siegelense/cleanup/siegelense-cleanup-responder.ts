/**
 * PURPOSE: The human surface `dungeonmaster siegelense cleanup` serves — the operator's bookend at
 * the start and end of a pass, rendered through `cleanupAnswerRenderTransformer` and written to
 * stdout. Writes through `process.stdout.write`, never `console.log`, matching
 * `SiegelenseFleetResponder`. Takes no arguments: `cleanup {}` is the only form (siegelense-tooling.md
 * line 2339).
 *
 * USAGE:
 * await SiegelenseCleanupResponder();
 * // Writes what was reaped, what ports/locks came back, and what was left alone with its reason
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { cleanupRunBroker } from '../../../brokers/cleanup/run/cleanup-run-broker';
import { cleanupAnswerRenderTransformer } from '../../../transformers/cleanup-answer-render/cleanup-answer-render-transformer';

export const SiegelenseCleanupResponder = async (): Promise<AdapterResult> => {
  const answer = await cleanupRunBroker();
  process.stdout.write(cleanupAnswerRenderTransformer({ answer }));
  return adapterResultContract.parse({ success: true });
};
