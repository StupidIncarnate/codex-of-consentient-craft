/**
 * PURPOSE: Strips timeout boilerplate from test failure messages, leaving only meaningful content
 *
 * USAGE:
 * stripTimeoutNoiseTransformer({ message: errorMessageContract.parse('Exceeded timeout of 5000 ms for a test.') });
 * // Returns 'Timed out (see network log below)' as ErrorMessage
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

const TIMEOUT_PATTERNS = [
  // Jest: primary timeout message (test and hook variants)
  /thrown: "Exceeded timeout of \d+\s*(?:ms|s) for a (?:test|hook)(?:\s+while waiting for `done\(\)` to be called)?\."/gu,
  /Exceeded timeout of \d+\s*(?:ms|s) for a (?:test|hook)(?:\s+while waiting for `done\(\)` to be called)?\./gu,

  // Jest: suggestion suffix
  /Add a timeout value to this test to increase the timeout, if this is a long-running test\. See https:\/\/jestjs\.io\/docs\/api#testname-fn-timeout\./gu,

  // Playwright: test-level timeout
  /Test timeout of \d+ms exceeded\./gu,
  /Test timeout of \d+ms exceeded while setting up "[^"]*"\./gu,
  /Test timeout of \d+ms exceeded while running "[^"]*" hook\./gu,
  /Tearing down "[^"]*" exceeded the test timeout of \d+ms\./gu,

  // Playwright: hook-level timeout
  /"[^"]*" hook timeout of \d+ms exceeded\./gu,

  // Playwright: fixture/worker/modifier timeout
  /Fixture "[^"]*" timeout of \d+ms exceeded during \w+\./gu,
  /Worker teardown timeout of \d+ms exceeded(?:\s+while \w+ "[^"]*")?\./gu,
  /"[^"]*" modifier timeout of \d+ms exceeded\./gu,

  // Playwright: step timeout
  /Step timeout of \d+ms exceeded\./gu,

  // Playwright: action/navigation/launch timeout
  /Timeout \d+ms exceeded while waiting for event "[^"]*"/gu,
  /Timeout \d+ms exceeded while waiting on the predicate/gu,
  /Timeout \d+ms exceeded\.?/gu,
];

const FALLBACK_MESSAGE = 'Timed out (see network log below)';

export const stripTimeoutNoiseTransformer = ({
  message,
}: {
  message: ErrorMessage;
}): ErrorMessage => {
  let result = message;

  for (const pattern of TIMEOUT_PATTERNS) {
    result = result.replace(pattern, '') as ErrorMessage;
  }

  const trimmed = result.trim();

  if (trimmed.length === 0) {
    return FALLBACK_MESSAGE as ErrorMessage;
  }

  return trimmed as ErrorMessage;
};
