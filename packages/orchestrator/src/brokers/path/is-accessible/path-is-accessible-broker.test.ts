import { pathIsAccessibleBroker } from './path-is-accessible-broker';
import { pathIsAccessibleBrokerProxy } from './path-is-accessible-broker.proxy';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

describe('pathIsAccessibleBroker', () => {
  describe('accessible paths', () => {
    it('VALID: {path: "/home/user/project"} => returns true when path is accessible', async () => {
      const proxy = pathIsAccessibleBrokerProxy();
      const path = '/home/user/project';

      proxy.setupResult({ path, result: true });

      const result = await pathIsAccessibleBroker({ path });

      expect(result).toBe(true);
    });
  });

  describe('inaccessible paths', () => {
    it('INVALID: {path: "/missing/project"} => returns false when path is not accessible', async () => {
      const proxy = pathIsAccessibleBrokerProxy();
      const path = '/missing/project';

      proxy.setupResult({ path, result: false });

      const result = await pathIsAccessibleBroker({ path });

      expect(result).toBe(false);
    });
  });

  describe('unreadable paths', () => {
    it('ERROR: {path: "/root/locked", EACCES} => returns false instead of rejecting', async () => {
      const proxy = pathIsAccessibleBrokerProxy();
      const path = '/root/locked';

      proxy.setupUnreadable({ path });

      const result = await pathIsAccessibleBroker({ path });

      expect(result).toBe(false);
    });
  });

  describe('relative paths', () => {
    it('INVALID: {path: "jo"} => returns false instead of throwing, even where the fs would answer true', async () => {
      const proxy = pathIsAccessibleBrokerProxy();
      const { path } = GuildStub({ path: 'jo' });

      proxy.setupResult({ path, result: true });

      const result = await pathIsAccessibleBroker({ path });

      expect(result).toBe(false);
    });

    it('INVALID: {path: "./jo"} => returns false because a guild path must be absolute', async () => {
      const proxy = pathIsAccessibleBrokerProxy();
      const { path } = GuildStub({ path: './jo' });

      proxy.setupResult({ path, result: true });

      const result = await pathIsAccessibleBroker({ path });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {path: undefined} => returns false', async () => {
      pathIsAccessibleBrokerProxy();

      const result = await pathIsAccessibleBroker({});

      expect(result).toBe(false);
    });
  });
});
