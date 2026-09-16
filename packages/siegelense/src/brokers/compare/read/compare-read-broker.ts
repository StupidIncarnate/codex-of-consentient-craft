/**
 * PURPOSE: `compare` itself — the index delta between two runs of ONE instance, a READING never a
 * verdict (siegelense-tooling.md line 2350). Reads both runs' stored `RunResult` returns off disk
 * for the signed count deltas and the last-shot pixel diff; `elements` stays absent on purpose
 * (chunk-03 §3.F) and `compareAnswerContract` is `.strict()`, so adding it back is a parse error, not
 * a design choice this file can make. `console.new` / `server.new` / `network.new` carry the lines
 * `newLinesLayerBroker` finds unique to run B, fed by `resultsReadBroker` — called once per run per
 * kind — rather than `bufferReadLayerBroker`/`transcriptReadLayerBroker` directly: those are LAYER
 * files inside `brokers/results/read/`, and `enforce-project-structure` refuses a cross-domain import
 * of either. `resultsReadBroker`, the `results` domain's own entry file, is the one door in.
 *
 * USAGE:
 * await compareReadBroker({ query: CompareQueryStub({ runA: 'run_4', runB: 'run_5' }) });
 * // Returns a validated CompareAnswer — signed deltas, a pixel reading, and the lines new to run B
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { compareAnswerContract } from '../../../contracts/compare-answer/compare-answer-contract';
import type { CompareAnswer } from '../../../contracts/compare-answer/compare-answer-contract';
import type { CompareQuery } from '../../../contracts/compare-query/compare-query-contract';
import { resultsQueryContract } from '../../../contracts/results-query/results-query-contract';
import { runResultContract } from '../../../contracts/run-result/run-result-contract';
import { countDeltaRenderTransformer } from '../../../transformers/count-delta-render/count-delta-render-transformer';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { instanceStateResolveBroker } from '../../instance/state-resolve/instance-state-resolve-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRunPathsFindBroker } from '../../locations/run-paths-find/locations-run-paths-find-broker';
import { resultsReadBroker } from '../../results/read/results-read-broker';
import { shotChangeReadBroker } from '../../shot/change-read/shot-change-read-broker';
import { newLinesLayerBroker } from './new-lines-layer-broker';

export const compareReadBroker = async ({
  query,
}: {
  query: CompareQuery;
}): Promise<CompareAnswer> => {
  const { instanceId, runA, runB } = query;

  const { entry } = await instanceStateResolveBroker({ instanceId });
  const evidencePath = locationsInstanceEvidencePathFindBroker({
    instanceId,
    guildId: entry?.guildId ?? null,
  });

  const runAPaths = locationsRunPathsFindBroker({ evidencePath, runId: runA });
  const runBPaths = locationsRunPathsFindBroker({ evidencePath, runId: runB });

  const [rawA, rawB] = await Promise.all([
    fsReadFileAdapter({ filePath: runAPaths.storedReturn }),
    fsReadFileAdapter({ filePath: runBPaths.storedReturn }),
  ]);

  const [
    consoleAnswerA,
    consoleAnswerB,
    serverAnswerA,
    serverAnswerB,
    networkAnswerA,
    networkAnswerB,
  ] = await Promise.all([
    resultsReadBroker({
      query: resultsQueryContract.parse({
        instanceId,
        runId: runA,
        step: null,
        kind: 'console',
        where: null,
        fields: null,
        since: null,
      }),
    }),
    resultsReadBroker({
      query: resultsQueryContract.parse({
        instanceId,
        runId: runB,
        step: null,
        kind: 'console',
        where: null,
        fields: null,
        since: null,
      }),
    }),
    resultsReadBroker({
      query: resultsQueryContract.parse({
        instanceId,
        runId: runA,
        step: null,
        kind: 'server',
        where: null,
        fields: null,
        since: null,
      }),
    }),
    resultsReadBroker({
      query: resultsQueryContract.parse({
        instanceId,
        runId: runB,
        step: null,
        kind: 'server',
        where: null,
        fields: null,
        since: null,
      }),
    }),
    resultsReadBroker({
      query: resultsQueryContract.parse({
        instanceId,
        runId: runA,
        step: null,
        kind: 'network',
        where: null,
        fields: null,
        since: null,
      }),
    }),
    resultsReadBroker({
      query: resultsQueryContract.parse({
        instanceId,
        runId: runB,
        step: null,
        kind: 'network',
        where: null,
        fields: null,
        since: null,
      }),
    }),
  ]);

  const resultA = runResultContract.parse(JSON.parse(rawA));
  const resultB = runResultContract.parse(JSON.parse(rawB));

  const shotA = resultA.shots.at(-1) ?? null;
  const shotB = resultB.shots.at(-1) ?? null;

  const pixelChange =
    shotB === null
      ? null
      : await shotChangeReadBroker({
          previousPath: shotA === null ? null : shotA.path,
          currentPath: shotB.path,
        });

  const pixels =
    pixelChange === null ? null : contentTextContract.parse(`last capture differs ${pixelChange}`);

  return compareAnswerContract.parse({
    instanceId,
    runA,
    runB,
    console: {
      errors: countDeltaRenderTransformer({
        before: resultA.index.console.errors,
        after: resultB.index.console.errors,
      }),
      new: newLinesLayerBroker({ linesA: consoleAnswerA.rows, linesB: consoleAnswerB.rows }),
    },
    server: {
      errors: countDeltaRenderTransformer({
        before: resultA.index.server.errors,
        after: resultB.index.server.errors,
      }),
      new: newLinesLayerBroker({ linesA: serverAnswerA.rows, linesB: serverAnswerB.rows }),
    },
    network: {
      non2xx: countDeltaRenderTransformer({
        before: resultA.index.network.non2xx,
        after: resultB.index.network.non2xx,
      }),
      new: newLinesLayerBroker({ linesA: networkAnswerA.rows, linesB: networkAnswerB.rows }),
    },
    pixels,
  });
};
