/**
 * PURPOSE: The surface `dungeonmaster siegelense prune` serves — the operator's reclaim table through
 * `pruneAnswerRenderTransformer` by default (when `isJson` is false or omitted), or one JSON document
 * on stdout (the raw `PruneAnswer`) when `isJson` is true (opted into with `--json`). Writes through
 * `process.stdout.write`, never `console.log`, matching every other siegelense responder. Carries no
 * refusal of its own: the argv parser has already rejected an unreadable window and a bad instance id
 * under their own flag names, and `pruneRunBroker` throws `InstanceUnknownError` for an id the registry
 * does not hold — so a typo refuses by name rather than sweeping the fleet. Reach for this over
 * `SiegelenseCleanupResponder`: that one reaps instances and ages assets as a side effect, while
 * this one is the call a caller reaches for when it wants the space back now.
 *
 * `confirm` DEFAULTS to false: a bare call is a dry run — `pruneRunBroker` still computes exactly
 * what it would select, but unlinks nothing and tombstones nothing — because a bare `prune`, with no
 * flags and no confirmation, once deleted 69 killed instances' evidence by mistake (DEF-49). The dry
 * run notice goes to `stdout` for the human table (so it reads right next to FREED/REMOVED) and to
 * `stderr` for `--json`, so a machine parsing `--json` still gets exactly ONE JSON document on stdout.
 *
 * USAGE:
 * await SiegelensePruneResponder({ query: PruneQueryStub() });
 * // A dry run: prints what WOULD be freed/removed/refused and the DRY RUN notice; deletes nothing
 *
 * await SiegelensePruneResponder({ query: PruneQueryStub(), confirm: true });
 * // Writes what was freed, what was taken, what was refused and which citation kinds went unchecked
 *
 * await SiegelensePruneResponder({ query: PruneQueryStub(), isJson: true, confirm: true });
 * // Writes the PruneAnswer as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { pruneRunBroker } from '../../../brokers/prune/run/prune-run-broker';
import type { PruneQuery } from '../../../contracts/prune-query/prune-query-contract';
import { pruneStatics } from '../../../statics/prune/prune-statics';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { pruneAnswerRenderTransformer } from '../../../transformers/prune-answer-render/prune-answer-render-transformer';

export const SiegelensePruneResponder = async ({
  query,
  isJson = false,
  confirm = false,
}: {
  query: PruneQuery;
  isJson?: boolean;
  confirm?: boolean;
}): Promise<AdapterResult> => {
  const answer = await pruneRunBroker({ query, dryRun: !confirm });

  if (!confirm) {
    const notice = `${pruneStatics.messages.dryRunNotice}\n`;
    if (isJson) {
      process.stderr.write(notice);
    } else {
      process.stdout.write(notice);
    }
  }

  process.stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : pruneAnswerRenderTransformer({ answer }),
  );
  return adapterResultContract.parse({ success: true });
};
