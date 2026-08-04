/**
 * PURPOSE: Formats a catch-clause `unknown` error into a single-line reason string, unwinding one level of Error.cause
 *
 * USAGE:
 * const reason = errorFormatReasonTransformer({ error });
 * // Error with no cause: "message"
 * // Error with a cause: "message | cause: causeMessage"
 * // Non-Error thrown value: String(error)
 */

import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

export const errorFormatReasonTransformer = ({ error }: { error: unknown }): ErrorMessage => {
  if (!(error instanceof Error)) {
    return errorMessageContract.parse(String(error));
  }
  if (!error.cause) {
    return errorMessageContract.parse(error.message);
  }
  const causeMessage =
    error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause);
  return errorMessageContract.parse(`${error.message} | cause: ${causeMessage}`);
};
