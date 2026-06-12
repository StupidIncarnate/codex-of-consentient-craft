import { notifications } from '@mantine/notifications';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const mantineNotificationsShowAdapterProxy = (): {
  getShownNotification: () => unknown;
  getShowCalls: () => unknown[];
} => {
  const handle = registerMock({ fn: notifications.show });
  handle.mockReturnValue('');

  return {
    getShownNotification: (): unknown => handle.mock.calls.at(-1)?.[0],
    getShowCalls: (): unknown[] => handle.mock.calls,
  };
};
