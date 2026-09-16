/**
 * PURPOSE: True when one network buffer line falls outside the [200, 300) success range — the SAME
 * boundary `runIndexComputeTransformer` counts into `network.non2xx`, and the one `compareReadBroker`
 * scopes `network.new` by, so a line can never read as non-2xx in one place and 2xx in the other. A
 * line with no numeric status (`"status":null`, a request that never got a response) counts as
 * non-2xx alongside anything outside the range, matching `runIndexComputeTransformer`'s treatment of
 * `requestfailed`. Built on `resultsStatics.patterns.networkStatus` rather than a locally declared
 * pattern, for the same reason `bufferReadLayerBroker`'s `where.level` filter reuses
 * `consoleError`/`consoleWarning` from that same static.
 *
 * USAGE:
 * isNetworkLineNon2xxGuard({ line: ContentTextStub({ value: '{"status":500}' }) });
 * // Returns true
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { resultsStatics } from '../../statics/results/results-statics';

const NON2XX_FLOOR = 200;
const NON2XX_CEILING = 300;

const NETWORK_STATUS_PATTERN = new RegExp(
  resultsStatics.patterns.networkStatus.source,
  resultsStatics.patterns.networkStatus.flags,
);

export const isNetworkLineNon2xxGuard = ({ line }: { line?: ContentText }): boolean => {
  if (!line) {
    return false;
  }

  const match = NETWORK_STATUS_PATTERN.exec(line);
  if (match?.[1] === undefined || match[1] === 'null') {
    return true;
  }
  const status = Number(match[1]);
  return status < NON2XX_FLOOR || status >= NON2XX_CEILING;
};
