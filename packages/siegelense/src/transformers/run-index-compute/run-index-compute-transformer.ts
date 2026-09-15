/**
 * PURPOSE: Pure counting over one run's WINDOW slices — console/network lines the browser buffered
 * since this run's own start, and server log lines read from the same byte offset — never the
 * instance's running total (siegelense-tooling.md line 90: "A run's index counts its OWN window,
 * never the running total... Otherwise run 5 reports 47 console errors that are mostly run 1's").
 * Each console line is the JSON `listenersLayerAdapter` builds — `"kind":"pageerror"` for an uncaught
 * exception, `"kind":"console","type":"error"|"warning"` for a console message — and JSON.stringify's
 * fixed key order (`at`, `kind`, `type`, ...) is what makes a plain substring match safe rather than a
 * full parse. Each network line carries `"status":<n|null>`; a request that never got a response
 * (`status: null`, from `requestfailed`) counts as non-2xx alongside anything outside [200, 300).
 * Reach for this over reading the buffers directly inside `runExecuteBroker`: keeping the counting
 * pure and separate is what lets it run with no browser and no server process at all.
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

const CONSOLE_ERROR_PATTERN = /"kind":"pageerror"|"kind":"console","type":"error"/u;
const NETWORK_STATUS_PATTERN = /"status":(null|\d+)/u;
const NON2XX_FLOOR = 200;
const NON2XX_CEILING = 300;
const SERVER_ERROR_PATTERN = /error/iu;

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
  const consoleWarnings = consoleLines.filter((line) =>
    line.includes('"kind":"console","type":"warning"'),
  ).length;

  const networkNon2xx = networkLines.filter((line) => {
    const match = NETWORK_STATUS_PATTERN.exec(line);
    if (match?.[1] === undefined || match[1] === 'null') {
      return true;
    }
    const status = Number(match[1]);
    return status < NON2XX_FLOOR || status >= NON2XX_CEILING;
  }).length;

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
