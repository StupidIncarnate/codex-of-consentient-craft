/**
 * PURPOSE: Drives the `health` step verb — captures a screenshot if shotPath is provided, checks
 * root element presence on the page, reads shot blankness, inspects console and network buffers
 * since the window start, and inspects server log lines for errors. Evaluates the composed health
 * reading ('HEALTHY', 'DEGRADED', 'DOWN') and returns the rendered verdict line as ContentText.
 *
 * USAGE:
 * await stepHealthBroker({
 *   lane,
 *   session,
 *   shotPath: AbsoluteFilePathStub({ value: '/repo/runs/run_1/step1.png' }),
 *   browserWindowStart: null,
 * });
 * // Returns ContentText: 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean'
 */

import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { BufferLengths } from '../../../contracts/buffer-lengths/buffer-lengths-contract';
import type { HexColour } from '../../../contracts/hex-colour/hex-colour-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
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
  let blankColour: HexColour | null = null;
  if (shotPath !== null) {
    const { blank: readingBlank, colour: readingColour } = await shotBlankReadBroker({ shotPath });
    blank = readingBlank;
    blankColour = readingColour;
  }

  const rootPresent = await session.checkRootPresent();

  const consoleFromIndex = browserWindowStart === null ? 0 : browserWindowStart.consoleLines;
  const consoleLines = session.readConsoleSince({ fromIndex: consoleFromIndex });
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

  const networkFromIndex = browserWindowStart === null ? 0 : browserWindowStart.networkLines;
  const networkLines = session.readNetworkSince({ fromIndex: networkFromIndex });

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
  });

  return reading.rendered;
};
