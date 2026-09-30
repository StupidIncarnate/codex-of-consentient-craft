/**
 * PURPOSE: Drives the `health` step verb — captures a screenshot if shotPath is provided, checks
 * root element presence on the page, reads shot blankness, inspects the console and network buffers
 * since the page last LOADED, and inspects server log lines for errors. Evaluates the composed health
 * reading ('HEALTHY', 'DEGRADED', 'DOWN') and returns the rendered verdict line as ContentText.
 *
 * The browser window is "since the last page load", not "since this run started": a run holding only
 * `{ "step": "health" }` loads nothing, so a run-scoped window saw no requests and judged a page whose
 * `/api/guilds` was answering 500 HEALTHY. The last load is the last network line whose
 * `resourceType` is `document`; network lines are judged from that line on, and console lines from its
 * `at` on (a console line with no readable `at` is kept). With no document line in the buffer the
 * window falls back to this run's own (`browserWindowStart`). The verdict line always ends with a note
 * naming the window it judged, and whether that load happened in this run or an earlier one. It never
 * reloads the page — a health reading must not change the state it reads.
 *
 * USAGE:
 * await stepHealthBroker({
 *   lane,
 *   session,
 *   shotPath: '/repo/runs/run_1/step1.png',
 *   browserWindowStart: null,
 * });
 * // Returns ContentText: 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean — judged since page load of / (this run)'
 */

import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { BufferLengths } from '../../../contracts/buffer-lengths/buffer-lengths-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { healthStatics } from '../../../statics/health/health-statics';
import { resultsStatics } from '../../../statics/results/results-statics';
import { healthReadingRenderTransformer } from '../../../transformers/health-reading-render/health-reading-render-transformer';
import { shotBlankReadBroker } from '../../shot/blank-read/shot-blank-read-broker';

const HTTP_5XX_MIN_STATUS = 500;
const HTTP_5XX_MAX_STATUS = 600;

const CONSOLE_ERROR_PATTERN = new RegExp(
  resultsStatics.patterns.consoleError.source,
  resultsStatics.patterns.consoleError.flags,
);

const SERVER_ERROR_PATTERN = new RegExp(
  resultsStatics.patterns.serverError.source,
  resultsStatics.patterns.serverError.flags,
);

export const stepHealthBroker = async ({
  lane,
  session,
  shotPath,
  browserWindowStart,
}: {
  lane: LaneSession;
  session: BrowserSession;
  shotPath: string | null;
  browserWindowStart: BufferLengths | null;
}): Promise<string> => {
  if (shotPath !== null) {
    await session.capture({ filePath: shotPath });
  }

  let blank = false;
  let blankColour: string | null = null;
  if (shotPath !== null) {
    const { blank: readingBlank, colour: readingColour } = await shotBlankReadBroker({ shotPath });
    blank = readingBlank;
    blankColour = readingColour;
  }

  const rootPresent = await session.checkRootPresent();

  const allNetworkLines = session.readNetworkSince({ fromIndex: 0 });
  const allConsoleLines = session.readConsoleSince({ fromIndex: 0 });

  const lastLoadIndex = allNetworkLines.reduce((found, line, index) => {
    const parsed = safeJsonParseTransformer({ value: line });
    return parsed.ok &&
      typeof parsed.value === 'object' &&
      parsed.value !== null &&
      'resourceType' in parsed.value &&
      parsed.value.resourceType === 'document'
      ? index
      : found;
  }, -1);
  const lastLoadLine = lastLoadIndex === -1 ? undefined : allNetworkLines[lastLoadIndex];
  const lastLoadParse =
    lastLoadLine === undefined ? null : safeJsonParseTransformer({ value: lastLoadLine });
  const lastLoad =
    lastLoadParse !== null &&
    lastLoadParse.ok &&
    typeof lastLoadParse.value === 'object' &&
    lastLoadParse.value !== null
      ? lastLoadParse.value
      : null;
  const lastLoadAt =
    lastLoad !== null && 'at' in lastLoad && typeof lastLoad.at === 'number' ? lastLoad.at : null;
  const lastLoadUrl =
    lastLoad !== null && 'url' in lastLoad && typeof lastLoad.url === 'string' ? lastLoad.url : '';

  const runNetworkStart = browserWindowStart === null ? 0 : browserWindowStart.networkLines;
  const runConsoleStart = browserWindowStart === null ? 0 : browserWindowStart.consoleLines;

  const networkLines =
    lastLoad === null
      ? allNetworkLines.slice(runNetworkStart)
      : allNetworkLines.slice(lastLoadIndex);
  const consoleLines =
    lastLoad === null
      ? allConsoleLines.slice(runConsoleStart)
      : allConsoleLines.filter((line) => {
          if (lastLoadAt === null) {
            return true;
          }
          const parsed = safeJsonParseTransformer({ value: line });
          if (
            parsed.ok &&
            typeof parsed.value === 'object' &&
            parsed.value !== null &&
            'at' in parsed.value &&
            typeof parsed.value.at === 'number'
          ) {
            return parsed.value.at >= lastLoadAt;
          }
          return true;
        });

  // The path, not the whole URL: every line on one lane shares the origin, so it only adds length.
  const schemeSeparator = '//';
  const schemeEnd = lastLoadUrl.indexOf(schemeSeparator);
  const originEnd =
    schemeEnd === -1 ? 0 : lastLoadUrl.indexOf('/', schemeEnd + schemeSeparator.length);
  const lastLoadPath = originEnd === -1 ? '' : lastLoadUrl.slice(originEnd);
  const windowNote =
    lastLoad === null
      ? healthStatics.formatting.windowNoLoad
      : `${healthStatics.formatting.windowSinceLoad} ${lastLoadPath === '' ? '/' : lastLoadPath} ${
          lastLoadIndex >= runNetworkStart
            ? healthStatics.formatting.windowLoadedThisRun
            : healthStatics.formatting.windowLoadedEarlierRun
        }`;

  const errorConsoleLines = consoleLines.filter((line) => CONSOLE_ERROR_PATTERN.test(line));
  const consoleErrors = errorConsoleLines.length;

  let firstConsoleError: string | null = null;
  const [firstConsoleLine] = errorConsoleLines;
  if (firstConsoleLine !== undefined) {
    const parseResult = safeJsonParseTransformer({ value: firstConsoleLine });
    if (
      parseResult.ok &&
      typeof parseResult.value === 'object' &&
      parseResult.value !== null &&
      'text' in parseResult.value &&
      typeof parseResult.value.text === 'string'
    ) {
      firstConsoleError = parseResult.value.text;
    } else {
      firstConsoleError = firstConsoleLine;
    }
  }

  let network5xxCountValue = 0;
  let first5xx: string | null = null;

  for (const line of networkLines) {
    const parseResult = safeJsonParseTransformer({ value: line });
    if (
      parseResult.ok &&
      typeof parseResult.value === 'object' &&
      parseResult.value !== null &&
      'status' in parseResult.value &&
      typeof parseResult.value.status === 'number' &&
      parseResult.value.status >= HTTP_5XX_MIN_STATUS &&
      parseResult.value.status < HTTP_5XX_MAX_STATUS
    ) {
      network5xxCountValue += 1;
      if (first5xx === null) {
        const method =
          'method' in parseResult.value && typeof parseResult.value.method === 'string'
            ? parseResult.value.method
            : '';
        const url =
          'url' in parseResult.value && typeof parseResult.value.url === 'string'
            ? parseResult.value.url
            : '';
        first5xx = `${method} ${url}`.trim();
      }
    }
  }
  const network5xxCount = network5xxCountValue;

  const serverLines = lane.readServerLogSince({ fromByte: 0 });
  const errorServerLines = serverLines.filter((line) => SERVER_ERROR_PATTERN.test(line));
  const serverErrors = errorServerLines.length;

  let firstServerError: string | null = null;
  const [firstServerLine] = errorServerLines;
  if (firstServerLine !== undefined) {
    firstServerError = firstServerLine;
  }

  const reading = healthReadingRenderTransformer({
    rootPresent,
    blank,
    blankColour,
    consoleErrors,
    firstConsoleError,
    network5xxCount,
    first5xx,
    serverErrors,
    firstServerError,
    windowNote,
  });

  return reading.rendered;
};
