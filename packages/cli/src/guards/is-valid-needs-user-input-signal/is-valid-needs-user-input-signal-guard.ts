/**
 * PURPOSE: Validates if a needs-user-input signal has all required fields (question and context)
 *
 * USAGE:
 * isValidNeedsUserInputSignalGuard({ signal });
 * // Returns true if signal is needs-user-input with both question and context, false otherwise
 */

import type { StreamSignal } from '../../contracts/stream-signal/stream-signal-contract';

export const isValidNeedsUserInputSignalGuard = ({
  signal,
}: {
  signal?: StreamSignal | null;
}): boolean => {
  if (signal === undefined || signal === null) {
    return false;
  }

  if (signal.signal !== 'needs-user-input') {
    return false;
  }

  if (signal.question === undefined || signal.context === undefined) {
    return false;
  }

  return true;
};
