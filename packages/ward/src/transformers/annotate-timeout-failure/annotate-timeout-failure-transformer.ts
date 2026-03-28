/**
 * PURPOSE: Detects timeout+no-assertions failure combos and replaces with actionable diagnostic annotation
 *
 * USAGE:
 * annotateTimeoutFailureTransformer({ failureMessages: ['thrown: "Exceeded timeout..."', 'Test "x" has no assertions...'] });
 * // Returns annotated message explaining the timeout, or null if not a timeout combo
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

const TIMEOUT_INDICATORS = [
  /Exceeded timeout of \d+/u,
  /Test timeout of \d+ms exceeded/u,
  /timeout of \d+ms exceeded/u,
  /Timeout \d+ms exceeded/u,
  /thrown: "Exceeded timeout/u,
  /thrown: "\s*$/mu,
  /thrown: ""/u,
];

const TIMEOUT_ANNOTATION = [
  'TIMEOUT: Test killed before reaching any expect() calls.',
  'This is NOT a missing assertion — something upstream hung.',
  'Do NOT rerun. Trace the code path from the test entry point.',
  'Common causes: poll loop waiting for unreachable state, swallowed',
  'error in catch handler, contract validation failure in async pipeline.',
].join('\n');

export const annotateTimeoutFailureTransformer = ({
  failureMessages,
}: {
  failureMessages: string[];
}): ErrorMessage | null => {
  const hasTimeout = failureMessages.some((msg) =>
    TIMEOUT_INDICATORS.some((pattern) => pattern.test(msg)),
  );
  const hasNoAssertions = failureMessages.some((msg) =>
    msg.includes('has no assertions. Add expect() calls or remove the test.'),
  );

  if (!hasTimeout || !hasNoAssertions) {
    return null;
  }

  return errorMessageContract.parse(TIMEOUT_ANNOTATION);
};
