/**
 * PURPOSE: `compare` itself — the index delta between two runs of ONE instance, a READING never a
 * verdict (siegelense-tooling.md:2458). Reads both runs' stored `RunResult` returns off disk for the
 * signed count deltas and the last-shot pixel diff; `elements` stays absent on purpose (chunk-03 §3.F)
 * and `compareAnswerContract` is `.strict()`, so adding it back is a parse error, not a design choice
 * this file can make. `console.new` / `server.new` scope AT THE QUERY, via `where: { level: 'error' }`
 * — the same narrowing `results { where: { level } }` already offers a caller, so this reuses tested
 * plumbing rather than re-filtering rows here. Network has no such lever: `resultWhereContract` carries
 * no status-code field, so network rows are fetched unscoped and narrowed here, after the read.
 *
 * `network.errors` and `network.new` both come from the SAME filtered row set — a 4xx/5xx status, or
 * no status at all (a request that never got a response) — so the count and the list can never
 * describe different things. A 3xx — a redirect, a 304 cache revalidation on an ordinary page reload —
 * is normal traffic and counts toward neither. siegelense-tooling.md:724-726, on `pixelChange`, states
 * the principle this filter applies here: "it routes attention; it measures nothing."
 * `console.errors`/`server.errors` already had this property — each counts the SAME category its own
 * `new:` list surfaces — and `network.errors` matches that pattern instead of being the one field that
 * didn't.
 *
 * `resultA.index.network.non2xx` / `resultB.index.network.non2xx` — the literal HTTP-range tally
 * `runIndexComputeTransformer` persists on every `RunResult`, and what `run` and `results` still show
 * — is deliberately NOT read here. Reusing it for `network.errors` would put back the exact
 * contradiction this field exists to avoid: a name promising "what's worth a look" computed from a set
 * that includes ordinary 3xx traffic. `run`'s own reading is unaffected by this file and keeps its
 * wider meaning; `compare` computes its own narrower one independently, over the same rows
 * `network.new` already filters. `isNetworkLineNon2xxGuard` stays out of both: its [200, 300) boundary
 * is wider than the 4xx/5xx-or-no-response floor this file applies, and reusing it here would move
 * `RunIndex.network.non2xx` too.
 *
 * An id with no registry row at all — `instanceStateResolveBroker`'s own `'unknown'` state — throws
 * `InstanceUnknownError` before any file is touched, rather than letting `fsReadFileAdapter` bubble a
 * raw ENOENT with a filesystem path in its message; a KNOWN instance whose named run never stored a
 * return (never completed, or its evidence was pruned) throws `RunMissingError` naming that run
 * instead. The two read differently on purpose — only the first means the id was never real.
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
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import { resultsStatics } from '../../../statics/results/results-statics';
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

// The same status extraction `isNetworkLineNon2xxGuard` runs, reused here for a DIFFERENT boundary:
// that guard's [200, 300) floor/ceiling feeds the persisted `RunIndex.network.non2xx` `run` shows, a
// reading this file leaves untouched. `NETWORK_ATTENTION_FLOOR` decides BOTH `network.errors` and
// `network.new` below — one floor, so the count and the list can never disagree.
const NETWORK_STATUS_PATTERN = new RegExp(
  resultsStatics.patterns.networkStatus.source,
  resultsStatics.patterns.networkStatus.flags,
);
const NETWORK_ATTENTION_FLOOR = 400;

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

  // Network has no query-level lever for status (see the header comment), so both runs' FULL row
  // sets are narrowed here, after the read, to what `network.errors` counts and `network.new` lists:
  // a 4xx/5xx status, or no status at all (a request that never got a response). A 3xx never reaches
  // either — a redirect or a 304 cache revalidation is ordinary traffic on any page reload.
  const networkFailureRowsA = networkAnswerA.rows.filter((line) => {
    const match = NETWORK_STATUS_PATTERN.exec(line);
    return (
      match?.[1] === undefined || match[1] === 'null' || Number(match[1]) >= NETWORK_ATTENTION_FLOOR
    );
  });
  const networkFailureRowsB = networkAnswerB.rows.filter((line) => {
    const match = NETWORK_STATUS_PATTERN.exec(line);
    return (
      match?.[1] === undefined || match[1] === 'null' || Number(match[1]) >= NETWORK_ATTENTION_FLOOR
    );
  });

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
      errors: countDeltaRenderTransformer({
        before: readingCountContract.parse(networkFailureRowsA.length),
        after: readingCountContract.parse(networkFailureRowsB.length),
      }),
      new: newLinesLayerBroker({ linesA: networkFailureRowsA, linesB: networkFailureRowsB }),
    },
    pixels,
  });
};
