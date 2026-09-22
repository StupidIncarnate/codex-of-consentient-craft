/**
 * PURPOSE: The surface `dungeonmaster siegelense results --instance <id> [--run <runId> | --since
 * boot] […]` serves — writes one `ResultsAnswer` to stdout as JSON, per §3.A of
 * `scrolls/seigelense/plans/chunk-04-cli-surface.md`. Carries NO registry-miss check, unlike
 * `SiegelenseCompareResponder`: `resultsReadBroker` already resolves an unrecognised instance id to
 * a real `instanceState: 'unknown'` answer with `rows: []` (spec line 2319: "`pruned` and `unknown`
 * are real answers, not empty results"), so that id writes its JSON document and exits 0 rather than
 * throwing. A failure `resultsReadBroker` DOES throw — `RunIdRequiredError`, against a finished
 * instance with no run named and no `since: 'boot'` — propagates unchanged; the CLI entry point
 * turns an uncaught throw into stderr text and exit 1.
 *
 * USAGE:
 * await SiegelenseResultsResponder({ query: ResultsQueryStub() });
 * // Writes the ResultsAnswer as a concise human view (or raw JSON when isJson: true) to stdout
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { resultsReadBroker } from '../../../brokers/results/read/results-read-broker';
import type { ResultsQuery } from '../../../contracts/results-query/results-query-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { resultsAnswerRenderTransformer } from '../../../transformers/results-answer-render/results-answer-render-transformer';

export const SiegelenseResultsResponder = async ({
  query,
  isJson = false,
}: {
  query: ResultsQuery;
  isJson?: boolean;
}): Promise<AdapterResult> => {
  const answer = await resultsReadBroker({ query });
  process.stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : resultsAnswerRenderTransformer({ answer }),
  );
  return adapterResultContract.parse({ success: true });
};
