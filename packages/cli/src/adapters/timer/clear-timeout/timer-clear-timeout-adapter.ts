/**
 * PURPOSE: Wraps global clearTimeout for cancelling scheduled timeouts
 *
 * USAGE:
 * timerClearTimeoutAdapter({ timerId });
 * // Cancels the scheduled timeout
 */

import type { TimerId } from '../../../contracts/timer-id/timer-id-contract';

export const timerClearTimeoutAdapter = ({ timerId }: { timerId: TimerId }): void => {
  clearTimeout(timerId as unknown as ReturnType<typeof setTimeout>);
};
