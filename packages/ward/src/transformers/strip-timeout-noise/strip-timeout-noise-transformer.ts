/**
 * PURPOSE: Strips timeout boilerplate from test failure messages, leaving only meaningful content
 *
 * USAGE:
 * stripTimeoutNoiseTransformer({ message: errorMessageContract.parse('Exceeded timeout of 5000 ms for a test.') });
 * // Returns 'Timed out (see network log below)' as ErrorMessage
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

const TIMEOUT_PATTERNS = [
  /thrown: "Exceeded timeout of \d+\s*ms for a test\."/gu,
  /Exceeded timeout of \d+\s*ms for a test\./gu,
  /Test timeout of \d+ms exceeded\./gu,
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
