/**
 * PURPOSE: The surface `dungeonmaster siegelense cleanup` serves — one JSON document on stdout by
 * default (the raw `CleanupAnswer`), or the operator's bookend table through
 * `cleanupAnswerRenderTransformer` when `human` is true (siegelense-tooling.md's `--human`
 * opt-out). `cleanup {}` still takes no OTHER input: `human` is the one flag the call recognises.
 * Writes through `process.stdout.write`, never `console.log`, matching `SiegelenseFleetResponder`.
 * The whole parameter defaults to `{ human: false }`: `SiegelenseFlow`'s current route calls this
 * responder with zero arguments, and that call site belongs to the route table (a later work item),
 * not to this file — without the default, destructuring `undefined` there would throw. **The
 * refusal for `--human` on a call with no renderer lives in `SiegelenseFlow`'s route table, not
 * here** — this responder only ever renders when told to.
 *
 * USAGE:
 * await SiegelenseCleanupResponder({ human: false });
 * // Writes the CleanupAnswer as one JSON document
 *
 * await SiegelenseCleanupResponder({ human: true });
 * // Writes what was reaped, what ports/locks came back, and what was left alone with its reason
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { cleanupRunBroker } from '../../../brokers/cleanup/run/cleanup-run-broker';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { cleanupAnswerRenderTransformer } from '../../../transformers/cleanup-answer-render/cleanup-answer-render-transformer';

export const SiegelenseCleanupResponder = async (
  {
    human,
  }: {
    human: boolean;
  } = { human: false },
): Promise<AdapterResult> => {
  const answer = await cleanupRunBroker();
  process.stdout.write(
    human
      ? cleanupAnswerRenderTransformer({ answer })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );
  return adapterResultContract.parse({ success: true });
};
