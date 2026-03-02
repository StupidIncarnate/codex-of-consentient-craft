import { Notifications } from '@mantine/notifications';

import { mantineNotificationsAdapter } from './mantine-notifications-adapter';
import { mantineNotificationsAdapterProxy } from './mantine-notifications-adapter.proxy';

describe('mantineNotificationsAdapter', () => {
  describe('returns Notifications component', () => {
    it('VALID: {} => returns the Mantine Notifications component', () => {
      mantineNotificationsAdapterProxy();

      const result = mantineNotificationsAdapter();

      expect(result).toStrictEqual(Notifications);
    });
  });
});
