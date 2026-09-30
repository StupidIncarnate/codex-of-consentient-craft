/**
 * PURPOSE: Formats a catch-clause `unknown` error into a single-line reason string, unwinding one level of Error.cause
 *
 * USAGE:
 * const reason = errorFormatReasonTransformer({ error });
 * // Error with no cause: "message"
 * // Error with a cause: "message | cause: causeMessage"
 * // Non-Error thrown value: String(error)
 */


export const errorFormatReasonTransformer = ({ error }: { error: unknown }): string => {
  if (!(error instanceof Error)) {
    return String(error);
  }
  if (!error.cause) {
    return error.message;
  }
  const causeMessage =
    error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause);
  return `${error.message} | cause: ${causeMessage}`;
};
