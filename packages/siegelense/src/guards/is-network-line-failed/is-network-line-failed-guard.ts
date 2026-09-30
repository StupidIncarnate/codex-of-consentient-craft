/**
 * PURPOSE: True when one network buffer line is a FAILED exchange — a 4xx/5xx status, or no status at
 * all (`"status":null`, a request that never got a response). A 3xx is not a failure: a redirect or a
 * 304 cache revalidation is ordinary traffic on any page reload, and counting it made a healthy load
 * read as one with a failed request. This is the one rule `runIndexComputeTransformer` counts into
 * `RunIndex.network.failed` and `compareReadBroker` counts into `network.errors`/`network.new`, so
 * `run`, `results` and `compare` can never classify the same line differently. Built on
 * `resultsStatics.patterns.networkStatus` rather than a locally declared pattern.
 *
 * USAGE:
 * isNetworkLineFailedGuard({ line: ContentTextStub({ value: '{"status":500}' }) });
 * // Returns true
 * isNetworkLineFailedGuard({ line: ContentTextStub({ value: '{"status":304}' }) });
 * // Returns false
 */

import { resultsStatics } from '../../statics/results/results-statics';

const FAILURE_FLOOR = 400;

const NETWORK_STATUS_PATTERN = new RegExp(
  resultsStatics.patterns.networkStatus.source,
  resultsStatics.patterns.networkStatus.flags,
);

export const isNetworkLineFailedGuard = ({ line }: { line?: string }): boolean => {
  if (!line) {
    return false;
  }

  const match = NETWORK_STATUS_PATTERN.exec(line);
  if (match?.[1] === undefined || match[1] === 'null') {
    return true;
  }
  return Number(match[1]) >= FAILURE_FLOOR;
};
