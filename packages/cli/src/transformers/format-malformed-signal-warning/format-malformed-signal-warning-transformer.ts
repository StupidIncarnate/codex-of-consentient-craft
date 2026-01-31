/**
 * PURPOSE: Formats a warning message for malformed needs-user-input signals
 *
 * USAGE:
 * const warning = formatMalformedSignalWarningTransformer({ signal });
 * // Returns warning message describing what fields are missing, or null if signal is valid
 */

import type { StreamSignal } from '../../contracts/stream-signal/stream-signal-contract';
import type { WarningMessage } from '../../contracts/warning-message/warning-message-contract';
import { warningMessageContract } from '../../contracts/warning-message/warning-message-contract';

export const formatMalformedSignalWarningTransformer = ({
  signal,
}: {
  signal?: StreamSignal | null;
}): WarningMessage | null => {
  if (signal === undefined || signal === null) {
    return null;
  }

  if (signal.signal !== 'needs-user-input') {
    return null;
  }

  const isMissingQuestion = signal.question === undefined;
  const isMissingContext = signal.context === undefined;

  if (!isMissingQuestion && !isMissingContext) {
    return null;
  }

  const fieldsText =
    isMissingQuestion && isMissingContext
      ? 'question and context'
      : isMissingQuestion
        ? 'question'
        : 'context';

  return warningMessageContract.parse(
    `Warning: Received needs-user-input signal but missing required field(s): ${fieldsText}. Returning to menu.`,
  );
};
