/**
 * PURPOSE: Wraps the Mantine `notifications.show` imperative API so widgets can raise a toast without depending directly on the @mantine/notifications package
 *
 * USAGE:
 * mantineNotificationsShowAdapter({ message: 'Failed to delete quest', color: 'red' });
 * // Shows a red toast and returns {success: true}
 */

import { notifications } from '@mantine/notifications';

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const mantineNotificationsShowAdapter = ({
  message,
  color,
}: {
  message: string;
  color: string;
}): AdapterResult => {
  notifications.show({ message, color });

  return { success: true as const };
};
