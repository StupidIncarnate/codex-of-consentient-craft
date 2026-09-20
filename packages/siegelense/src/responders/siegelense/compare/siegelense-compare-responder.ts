/**
 * PURPOSE: The surface `dungeonmaster siegelense compare --instance <id> --run-a <runId> --run-b
 * <runId>` serves — writes one `CompareAnswer` to stdout as JSON, per §3.A of
 * `scrolls/seigelense/plans/chunk-04-cli-surface.md`. Carries NO registry-miss check of its own,
 * unlike `SiegelenseKillResponder`/`SiegelenseRunResponder`: `compareReadBroker` already throws its
 * own `InstanceUnknownError` for an unrecognised instance id and `RunMissingError` for a named run
 * with no stored return, so re-checking the registry here would only duplicate the read
 * `instanceStateResolveBroker` already makes inside the broker. Both errors propagate unchanged; the
 * CLI entry point turns an uncaught throw into stderr text and exit 1.
 *
 * USAGE:
 * await SiegelenseCompareResponder({ query: CompareQueryStub() });
 * // Writes the CompareAnswer as one JSON document to stdout
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { compareReadBroker } from '../../../brokers/compare/read/compare-read-broker';
import type { CompareQuery } from '../../../contracts/compare-query/compare-query-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { compareAnswerRenderTransformer } from '../../../transformers/compare-answer-render/compare-answer-render-transformer';

export const SiegelenseCompareResponder = async ({
  query,
  json = false,
}: {
  query: CompareQuery;
  json?: boolean | undefined;
}): Promise<AdapterResult> => {
  const answer = await compareReadBroker({ query });
  process.stdout.write(
    json
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : compareAnswerRenderTransformer({ answer }),
  );
  return adapterResultContract.parse({ success: true });
};
