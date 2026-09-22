/**
 * PURPOSE: The surface `dungeonmaster siegelense cleanup` serves — the operator's bookend table
 * through `cleanupAnswerRenderTransformer` by default (when `isJson` is false or omitted), or one
 * JSON document on stdout (the raw `CleanupAnswer`) when `isJson` is true (opted into with
 * `--json`). Writes through `process.stdout.write`, never `console.log`, matching `SiegelenseFleetResponder`.
 * The whole parameter defaults to `{ isJson: false }`: calling this responder with zero arguments
 * outputs the human table by default.
 *
 * USAGE:
 * await SiegelenseCleanupResponder();
 * // Writes what was reaped, what ports/locks came back, and what was left alone with its reason
 *
 * await SiegelenseCleanupResponder({ isJson: true });
 * // Writes the CleanupAnswer as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { cleanupRunBroker } from '../../../brokers/cleanup/run/cleanup-run-broker';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { cleanupAnswerRenderTransformer } from '../../../transformers/cleanup-answer-render/cleanup-answer-render-transformer';

export const SiegelenseCleanupResponder = async (
  {
    isJson = false,
  }: {
    isJson?: boolean;
  } = { isJson: false },
): Promise<AdapterResult> => {
  const answer = await cleanupRunBroker();
  process.stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : cleanupAnswerRenderTransformer({ answer }),
  );
  return adapterResultContract.parse({ success: true });
};
