/**
 * PURPOSE: Pure counting over one run's WINDOW slices — console/network lines the browser buffered
 * since this run's own start, and server log lines read from the same byte offset — never the
 * instance's running total (siegelense-tooling.md line 90: "A run's index counts its OWN window,
 * never the running total... Otherwise run 5 reports 47 console errors that are mostly run 1's").
 * Each console line is the JSON `listenersLayerAdapter` builds — `"kind":"pageerror"` for an uncaught
 * exception, `"kind":"console","type":"error"|"warning"` for a console message — and JSON.stringify's
 * fixed key order (`at`, `kind`, `type`, ...) is what makes a plain substring match safe rather than a
 * full parse. Network lines are classified by `isNetworkLineNon2xxGuard` — the one place that decides
 * what counts as non-2xx, so this count and `compareReadBroker`'s `network.new` scoping can never
 * disagree. Every console/server pattern is built from `resultsStatics.patterns` rather than a
 * locally declared regex, so this count and a `results { where: { level } }` query can never classify
 * the same line differently (chunk-03-read-path-and-perception.md §3.A: "One error pattern, one
 * place"). Reach for this over reading the buffers directly inside `runExecuteBroker`: keeping the
 * counting pure and separate is what lets it run with no browser and no server process at all.
 *
 * USAGE:
 * runIndexComputeTransformer({
 *   consoleLines: [ContentTextStub({ value: '{"at":1,"kind":"console","type":"error","text":"x","url":"","line":0}' })],
 *   networkLines: [], serverLines: [],
 * });
 * // Returns a validated RunIndex counting only those lines
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { readingCountContract } from '../../contracts/reading-count/reading-count-contract';
import { runIndexContract } from '../../contracts/run-index/run-index-contract';
import type { RunIndex } from '../../contracts/run-index/run-index-contract';
import { isNetworkLineNon2xxGuard } from '../../guards/is-network-line-non2xx/is-network-line-non2xx-guard';
import { resultsStatics } from '../../statics/results/results-statics';

const CONSOLE_ERROR_PATTERN = new RegExp(
  resultsStatics.patterns.consoleError.source,
  resultsStatics.patterns.consoleError.flags,
);
const CONSOLE_WARNING_PATTERN = new RegExp(
  resultsStatics.patterns.consoleWarning.source,
  resultsStatics.patterns.consoleWarning.flags,
);
const SERVER_ERROR_PATTERN = new RegExp(
  resultsStatics.patterns.serverError.source,
  resultsStatics.patterns.serverError.flags,
);

export const runIndexComputeTransformer = ({
  consoleLines,
  networkLines,
  serverLines,
}: {
  consoleLines: readonly ContentText[];
  networkLines: readonly ContentText[];
  serverLines: readonly ContentText[];
}): RunIndex => {
  const consoleErrors = consoleLines.filter((line) => CONSOLE_ERROR_PATTERN.test(line)).length;
  const consoleWarnings = consoleLines.filter((line) => CONSOLE_WARNING_PATTERN.test(line)).length;

  const networkNon2xx = networkLines.filter((line) => isNetworkLineNon2xxGuard({ line })).length;

  const serverErrors = serverLines.filter((line) => SERVER_ERROR_PATTERN.test(line)).length;

  return runIndexContract.parse({
    console: {
      errors: readingCountContract.parse(consoleErrors),
      warnings: readingCountContract.parse(consoleWarnings),
    },
    server: { errors: readingCountContract.parse(serverErrors) },
    network: {
      exchanges: readingCountContract.parse(networkLines.length),
      non2xx: readingCountContract.parse(networkNon2xx),
    },
  });
};
