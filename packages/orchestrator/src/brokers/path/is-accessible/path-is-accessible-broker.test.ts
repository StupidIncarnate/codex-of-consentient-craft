import { GuildPathStub } from '@dungeonmaster/shared/contracts';

import { pathIsAccessibleBroker } from './path-is-accessible-broker';
import { pathIsAccessibleBrokerProxy } from './path-is-accessible-broker.proxy';

describe('pathIsAccessibleBroker', () => {
  describe('accessible paths', () => {
    it('VALID: {path: "/home/user/project"} => returns true when path is accessible', async () => {
      const proxy = pathIsAccessibleBrokerProxy();
      const path = GuildPathStub({ value: '/home/user/project' });

      proxy.setupResult({ result: true });

      const result = await pathIsAccessibleBroker({ path });

      expect(result).toBe(true);
    });
  });

  describe('inaccessible paths', () => {
    it('INVALID_PATH: {path: "/missing/project"} => returns false when path is not accessible', async () => {
      const proxy = pathIsAccessibleBrokerProxy();
      const path = GuildPathStub({ value: '/missing/project' });

      proxy.setupResult({ result: false });

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
