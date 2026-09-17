/**
 * PURPOSE: The surface `dungeonmaster siegelense prune` serves — one JSON document on stdout by
 * default (the raw `PruneAnswer`), or the operator's reclaim table through
 * `pruneAnswerRenderTransformer` when `human` is true. Writes through `process.stdout.write`, never
 * `console.log`, matching every other siegelense responder. Carries no refusal of its own: the
 * argv parser has already rejected an unreadable window and a bad instance id under their own flag
 * names, and `pruneRunBroker` throws `InstanceUnknownError` for an id the registry does not hold —
 * so a typo refuses by name rather than sweeping the fleet. Reach for this over
 * `SiegelenseCleanupResponder`: that one reaps instances and ages assets as a side effect, while
 * this one is the call a caller reaches for when it wants the space back now.
 *
 * USAGE:
 * await SiegelensePruneResponder({ query: PruneQueryStub(), human: false });
 * // Writes the PruneAnswer as one JSON document
 *
 * await SiegelensePruneResponder({ query: PruneQueryStub(), human: true });
 * // Writes what was freed, what was taken, what was refused and which citation kinds went unchecked
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { pruneRunBroker } from '../../../brokers/prune/run/prune-run-broker';
import type { PruneQuery } from '../../../contracts/prune-query/prune-query-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { pruneAnswerRenderTransformer } from '../../../transformers/prune-answer-render/prune-answer-render-transformer';

export const SiegelensePruneResponder = async ({
  query,
  human = false,
}: {
  query: PruneQuery;
  human: boolean;
}): Promise<AdapterResult> => {
  const answer = await pruneRunBroker({ query });
  process.stdout.write(
    human
      ? pruneAnswerRenderTransformer({ answer })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );
  return adapterResultContract.parse({ success: true });
};
