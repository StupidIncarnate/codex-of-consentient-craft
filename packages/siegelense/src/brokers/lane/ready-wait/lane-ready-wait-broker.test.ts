import { laneReadyWaitBroker } from './lane-ready-wait-broker';
import { laneReadyWaitBrokerProxy } from './lane-ready-wait-broker.proxy';

describe('laneReadyWaitBroker', () => {
  describe('a server that answers on the first probe', () => {
    it('VALID: {url reachable} => returns true', async () => {
      const proxy = laneReadyWaitBrokerProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupReachable({ url });

      const result = await laneReadyWaitBroker({ url, deadlineMs: 1_700_000_180_000 });

      expect(result).toBe(true);
    });
  });

  describe('a server whose deadline has already passed', () => {
    it('EDGE: {never reachable, deadline exceeded} => returns false with no real wait', async () => {
      const proxy = laneReadyWaitBrokerProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      const deadlineMs = 1_700_000_000_000;
      proxy.setupUnreachable({ url });
      proxy.stageDeadlineExceeded({ firstCallMs: deadlineMs + 1, thenMs: deadlineMs + 1 });

      const result = await laneReadyWaitBroker({ url, deadlineMs });

      expect(result).toBe(false);
    });
  });
});
