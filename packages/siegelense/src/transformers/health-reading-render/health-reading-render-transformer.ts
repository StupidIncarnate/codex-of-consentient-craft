/**
 * PURPOSE: Computes the overall health verdict ('HEALTHY', 'DEGRADED', 'DOWN') and formats the
 * single verdict line for the `health` step verb, composing five readings (root element presence,
 * shot blankness, console error count and first message, network 5xx count and first 5xx, and
 * server log error count).
 *
 * USAGE:
 * healthReadingRenderTransformer({
 *   rootPresent: true,
 *   blank: false,
 *   blankColour: null,
 *   consoleErrors: ReadingCountStub({ value: 0 }),
 *   firstConsoleError: null,
 *   network5xxCount: ReadingCountStub({ value: 0 }),
 *   first5xx: null,
 *   serverErrors: ReadingCountStub({ value: 0 }),
 *   firstServerError: null,
 * });
 * // Returns a validated HealthReading whose rendered text is:
 * // 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { healthReadingContract } from '../../contracts/health-reading/health-reading-contract';
import type { HealthReading } from '../../contracts/health-reading/health-reading-contract';
import { healthVerdictContract } from '../../contracts/health-verdict/health-verdict-contract';
import type { HexColour } from '../../contracts/hex-colour/hex-colour-contract';
import type { ReadingCount } from '../../contracts/reading-count/reading-count-contract';
import { healthStatics } from '../../statics/health/health-statics';

export const healthReadingRenderTransformer = ({
  rootPresent,
  blank,
  blankColour,
  consoleErrors,
  firstConsoleError,
  network5xxCount,
  first5xx,
  serverErrors,
  firstServerError,
}: {
  rootPresent: boolean;
  blank: boolean;
  blankColour: HexColour | null;
  consoleErrors: ReadingCount;
  firstConsoleError: ContentText | null;
  network5xxCount: ReadingCount;
  first5xx: ContentText | null;
  serverErrors: ReadingCount;
  firstServerError: ContentText | null;
}): HealthReading => {
  const isDown = !rootPresent || blank;
  const isDegraded = !isDown && (consoleErrors > 0 || network5xxCount > 0 || serverErrors > 0);

  const verdict = isDown
    ? healthStatics.verdicts.down
    : isDegraded
      ? healthStatics.verdicts.degraded
      : healthStatics.verdicts.healthy;

  const rootText = rootPresent
    ? healthStatics.formatting.rootPresent
    : healthStatics.formatting.rootAbsent;

  const blankText = blank
    ? blankColour === null
      ? 'page blank'
      : `page blank (${blankColour})`
    : healthStatics.formatting.notBlank;

  const consoleText =
    consoleErrors === 0
      ? healthStatics.formatting.consoleClean
      : firstConsoleError === null
        ? `console: ${String(consoleErrors)} ${consoleErrors === 1 ? 'error' : 'errors'}`
        : `console: ${String(consoleErrors)} ${consoleErrors === 1 ? 'error' : 'errors'} "${firstConsoleError}"`;

  const networkText =
    network5xxCount === 0
      ? healthStatics.formatting.no5xx
      : first5xx === null
        ? `network: ${String(network5xxCount)} 5xx`
        : `network: ${String(network5xxCount)} 5xx "${first5xx}"`;

  const serverText =
    serverErrors === 0
      ? healthStatics.formatting.serverClean
      : `server log: ${String(serverErrors)} ${serverErrors === 1 ? 'error' : 'errors'}`;

  const segments = [rootText, blankText, consoleText, networkText, serverText];
  const renderedText = `${verdict.padEnd(healthStatics.formatting.verdictPaddedLength, ' ')}${segments.join(healthStatics.formatting.separator)}`;

  return healthReadingContract.parse({
    verdict: healthVerdictContract.parse(verdict),
    rootPresent,
    blank,
    blankColour,
    consoleErrors,
    firstConsoleError,
    network5xxCount,
    first5xx,
    serverErrors,
    firstServerError,
    rendered: contentTextContract.parse(renderedText),
  });
};
