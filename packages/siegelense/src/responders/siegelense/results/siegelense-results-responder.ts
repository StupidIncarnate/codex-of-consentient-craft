/**
 * PURPOSE: The surface `dungeonmaster siegelense results --instance <id> [--run <runId> | --since
 * boot] […]` serves — writes one `ResultsAnswer` to stdout as JSON, per §3.A of
 * `scrolls/seigelense/plans/chunk-04-cli-surface.md`. Reads the registry FIRST and throws
 * `InstanceUnknownError` on a miss, the same check `SiegelenseKillResponder`/`SiegelenseRunResponder`
 * make: agents read exit codes to decide what happened, so an id the registry never held refuses
 * (exit 1) rather than answering a typed `instanceState: 'unknown'` reading (exit 0).
 * `resultsReadBroker` itself is untouched and still answers `'pruned'`/`'dead'`/`'killed'` normally —
 * every one of those DOES have a registry row, so this check passes it straight through (spec line
 * 2319: "`pruned` and `unknown` are real answers, not empty results" still holds for every state this
 * check does not intercept). A failure `resultsReadBroker` DOES throw — `RunIdRequiredError`, against
 * a finished instance with no run named and no `since: 'boot'` — propagates unchanged; the CLI entry
 * point turns an uncaught throw into stderr text and exit 1.
 *
 * USAGE:
 * await SiegelenseResultsResponder({ query: ResultsQueryStub() });
 * // Writes the ResultsAnswer as a concise human view (or raw JSON when isJson: true) to stdout
 */

import { stdout } from '#gateway/node/process';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { resultsReadBroker } from '../../../brokers/results/read/results-read-broker';
import type { ResultsQuery } from '../../../contracts/results-query/results-query-contract';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { resultsAnswerRenderTransformer } from '../../../transformers/results-answer-render/results-answer-render-transformer';

export const SiegelenseResultsResponder = async ({
  query,
  isJson = false,
}: {
  query: ResultsQuery;
  isJson?: boolean;
}): Promise<AdapterResult> => {
  const registry = await registryReadBroker();
  const isKnownInstance = registry.instances.some((candidate) => candidate.id === query.instanceId);
  if (!isKnownInstance) {
    throw new InstanceUnknownError({ instanceId: query.instanceId });
  }

  const answer = await resultsReadBroker({ query });
  stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : resultsAnswerRenderTransformer({ answer }),
  );
  return adapterResultContract.parse({ success: true });
};
