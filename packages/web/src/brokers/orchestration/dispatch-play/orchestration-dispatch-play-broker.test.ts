import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchPlayBroker } from './orchestration-dispatch-play-broker';
import { orchestrationDispatchPlayBrokerProxy } from './orchestration-dispatch-play-broker.proxy';

describe('orchestrationDispatchPlayBroker', () => {
  describe('allowed play', () => {
    it('VALID: {} => returns allowed response with state', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();
      const state = DispatchStateStub({ mode: 'node-playing' });

      proxy.setupAllowed({ state });

      const result = await orchestrationDispatchPlayBroker();

      expect(result).toStrictEqual({ allowed: true, state });
    });

    it('VALID: {force: true} => returns allowed response with state', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();
      const state = DispatchStateStub({ mode: 'node-playing' });

      proxy.setupAllowed({ state });

      const result = await orchestrationDispatchPlayBroker({ force: true });

      expect(result).toStrictEqual({ allowed: true, state });
    });
  });

  describe('denied play (409)', () => {
    it('VALID: {409 denial} => returns denial body instead of throwing', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();
      const state = DispatchStateStub({ mode: 'paused' });

      proxy.setupDenied({ reason: 'A /dumpster-launch loop owns the queue', state });

      const result = await orchestrationDispatchPlayBroker();

      expect(result).toStrictEqual({
        allowed: false,
        reason: 'A /dumpster-launch loop owns the queue',
        state,
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();

      proxy.setupError();

      await expect(orchestrationDispatchPlayBroker()).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();

      proxy.setupInvalidResponse({ data: { bad: 'data' } });

      await expect(orchestrationDispatchPlayBroker()).rejects.toThrow(/invalid_/u);
    });
  });
});
