/**
 * PURPOSE: `compare` itself — the index delta between two runs of ONE instance, a READING never a
 * verdict (siegelense-tooling.md line 2350). Reads both runs' stored `RunResult` returns off disk
 * for the signed count deltas and the last-shot pixel diff; `elements` stays absent on purpose
 * (chunk-03 §3.F) and `compareAnswerContract` is `.strict()`, so adding it back is a parse error, not
 * a design choice this file can make. `console.new` / `server.new` / `network.new` carry only the
 * lines `newLinesLayerBroker` finds unique to run B **in the same category as the paired count field**
 * (spec lines 2857-2859: `errors` pairs with new ERRORS, `non2xx` pairs with new NON-2XX exchanges) —
 * fed by `resultsReadBroker`, called once per run per kind, rather than
 * `bufferReadLayerBroker`/`transcriptReadLayerBroker`/`serverWindowReadLayerBroker` directly: those
 * are LAYER files inside `brokers/results/read/`, and `enforce-project-structure` refuses a
 * cross-domain import of any of them. `resultsReadBroker`, the `results` domain's own entry file, is
 * the one door in. Console and server scope AT THE QUERY, via `where: { level: 'error' }` — the same
 * narrowing `results { where: { level } }` already offers a caller, so this reuses tested plumbing
 * rather than re-filtering rows here. Network has no such lever: `resultWhereContract` carries no
 * status-code field, and `where.level` filtering (in `bufferReadLayerBroker`) only ever tests a
 * line against the CONSOLE error/warning patterns regardless of `kind`, so passing `level` for a
 * `network` query would silently match nothing. Network rows are therefore fetched unscoped, same as
 * before, and filtered to non-2xx AFTER the read via `isNetworkLineNon2xxGuard` — the same
 * classification `runIndexComputeTransformer` counts `network.non2xx` with, so the two can never
 * disagree about what "non-2xx" means. An id with no registry row at all —
 * `instanceStateResolveBroker`'s own `'unknown'` state — throws `InstanceUnknownError` before any
 * file is touched, rather than letting `fsReadFileAdapter` bubble a raw ENOENT with a filesystem path
 * in its message; a KNOWN instance whose named run never stored a return (never completed, or its
 * evidence was pruned) throws `RunMissingError` naming that run instead. The two read differently on
 * purpose — only the first means the id was never real.
 *
 * USAGE:
 * await compareReadBroker({ query: CompareQueryStub({ runA: 'run_4', runB: 'run_5' }) });
 * // Returns a validated CompareAnswer — signed deltas, a pixel reading, and the lines new to run B
 *
 * await compareReadBroker({ query: CompareQueryStub({ instanceId: 'inst_deadbeef' }) });
 * // Throws InstanceUnknownError — no registry row for that id, no file ever touched
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { compareAnswerContract } from '../../../contracts/compare-answer/compare-answer-contract';
import type { CompareAnswer } from '../../../contracts/compare-answer/compare-answer-contract';
import type { CompareQuery } from '../../../contracts/compare-query/compare-query-contract';
import { resultsQueryContract } from '../../../contracts/results-query/results-query-contract';
import { resultWhereContract } from '../../../contracts/result-where/result-where-contract';
import { runResultContract } from '../../../contracts/run-result/run-result-contract';
import { countDeltaRenderTransformer } from '../../../transformers/count-delta-render/count-delta-render-transformer';
import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { RunMissingError } from '../../../errors/run-missing/run-missing-error';
import { isNetworkLineNon2xxGuard } from '../../../guards/is-network-line-non2xx/is-network-line-non2xx-guard';
import { instanceStateResolveBroker } from '../../instance/state-resolve/instance-state-resolve-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRunPathsFindBroker } from '../../locations/run-paths-find/locations-run-paths-find-broker';
import { resultsReadBroker } from '../../results/read/results-read-broker';
import { shotChangeReadBroker } from '../../shot/change-read/shot-change-read-broker';
import { newLinesLayerBroker } from './new-lines-layer-broker';

// Both console and server scope their `new:` list to error lines only — the same category their
// paired `errors` count field measures — by asking `results` to filter at the query, via the SAME
// `where.level` narrowing a caller already gets from `results { where: { level: 'error' } }`.
const ERROR_WHERE = resultWhereContract.parse({
  path: null,
  method: null,
  nth: null,
  level: 'error',
  steps: null,
});

export const compareReadBroker = async ({
  query,
}: {
  query: CompareQuery;
}): Promise<CompareAnswer> => {
  const { instanceId, runA, runB } = query;

  const { state, entry } = await instanceStateResolveBroker({ instanceId });
  if (state === 'unknown') {
    throw new InstanceUnknownError({ instanceId });
  }

  const evidencePath = locationsInstanceEvidencePathFindBroker({
    instanceId,
    guildId: entry?.guildId ?? null,
  });

  const runAPaths = locationsRunPathsFindBroker({ evidencePath, runId: runA });
  const runBPaths = locationsRunPathsFindBroker({ evidencePath, runId: runB });

  const [rawA, rawB] = await Promise.all([
    fsReadFileAdapter({ filePath: runAPaths.storedReturn }).catch((error: unknown) => {
      if (
        error !== null &&
        typeof error === 'object' &&
        errorIsNativeErrorAdapter({ value: error }) &&
        'cause' in error &&
        error.cause !== null &&
        typeof error.cause === 'object' &&
        errorIsNativeErrorAdapter({ value: error.cause }) &&
        'code' in error.cause &&
        error.cause.code === 'ENOENT'
      ) {
        throw new RunMissingError({ instanceId, runId: runA });
      }
      throw error;
    }),
    fsReadFileAdapter({ filePath: runBPaths.storedReturn }).catch((error: unknown) => {
      if (
        error !== null &&
        typeof error === 'object' &&
        errorIsNativeErrorAdapter({ value: error }) &&
        'cause' in error &&
        error.cause !== null &&
        typeof error.cause === 'object' &&
        errorIsNativeErrorAdapter({ value: error.cause }) &&
        'code' in error.cause &&
        error.cause.code === 'ENOENT'
      ) {
        throw new RunMissingError({ instanceId, runId: runB });
      }
      throw error;
    }),
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
        where: ERROR_WHERE,
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
        where: ERROR_WHERE,
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
        where: ERROR_WHERE,
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
        where: ERROR_WHERE,
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

  // Network has no query-level lever for non-2xx (see the header comment), so both runs' FULL row
  // sets are narrowed here, after the read, to the same category `network.non2xx` counts.
  const networkNon2xxRowsA = networkAnswerA.rows.filter((line) =>
    isNetworkLineNon2xxGuard({ line }),
  );
  const networkNon2xxRowsB = networkAnswerB.rows.filter((line) =>
    isNetworkLineNon2xxGuard({ line }),
  );

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
      new: newLinesLayerBroker({ linesA: networkNon2xxRowsA, linesB: networkNon2xxRowsB }),
    },
    pixels,
  });
};
