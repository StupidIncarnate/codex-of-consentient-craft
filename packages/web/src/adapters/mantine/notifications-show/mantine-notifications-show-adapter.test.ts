import { mantineNotificationsShowAdapter } from './mantine-notifications-show-adapter';
import { mantineNotificationsShowAdapterProxy } from './mantine-notifications-show-adapter.proxy';

describe('mantineNotificationsShowAdapter', () => {
  describe('showing a toast', () => {
    it("VALID: {message: 'Failed to delete quest', color: 'red'} => calls notifications.show once with that message and color", () => {
      const proxy = mantineNotificationsShowAdapterProxy();

      const result = mantineNotificationsShowAdapter({
        message: 'Failed to delete quest',
        color: 'red',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getShowCalls()).toStrictEqual([
        [{ message: 'Failed to delete quest', color: 'red' }],
      ]);
      expect(proxy.getShownNotification()).toStrictEqual({
        message: 'Failed to delete quest',
        color: 'red',
      });
    });
  });
});
