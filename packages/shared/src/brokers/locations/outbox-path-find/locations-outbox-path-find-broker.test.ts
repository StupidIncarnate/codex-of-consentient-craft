import { locationsOutboxPathFindBroker } from './locations-outbox-path-find-broker';
import { locationsOutboxPathFindBrokerProxy } from './locations-outbox-path-find-broker.proxy';

describe('locationsOutboxPathFindBroker', () => {
  describe('outbox path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/event-outbox.jsonl', () => {
      const proxy = locationsOutboxPathFindBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        outboxPath: '/home/user/.dungeonmaster/event-outbox.jsonl',
      });

      const result = locationsOutboxPathFindBroker();

      expect(result).toBe(
        '/home/user/.dungeonmaster/event-outbox.jsonl',
      );
    });
  });
});
