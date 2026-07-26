import { notifications } from '@mantine/notifications';

import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const mantineNotificationsShowAdapterProxy = (): {
  getShownNotification: () => unknown;
  getShowCalls: () => unknown[];
} => {
  // mantineNotificationsShowAdapter discards notifications.show's return value — it exists to
  // fire the toast, nothing reads back what it resolves to. This proxy is a pure observer shared
  // by every widget that raises a toast, so the message/color payload can't be known ahead of
  // time — the address is a predicate over the one real invariant: it's always called with a
  // single notification-payload object.
  const handle: MockHandle = registerMock({ fn: notifications.show });
  handle
    .calledWith([(payload: unknown) => typeof payload === 'object' && payload !== null])
    .returns(undefined);

  return {
    getShownNotification: (): unknown => handle.callsMatching([]).at(-1)?.[0],
    getShowCalls: (): unknown[] => handle.callsMatching([]),
  };
};
