import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

import { orchestrationDispatchPlayBroker } from './orchestration-dispatch-play-broker';
import { orchestrationDispatchPlayBrokerProxy } from './orchestration-dispatch-play-broker.proxy';

describe('orchestrationDispatchPlayBroker', () => {
  describe('successful play', () => {
    it('VALID: {} => returns playing dispatch state from API', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();
      const state = DispatchStateStub({ mode: 'node-playing' });

      proxy.setupState({ state });

      const result = await orchestrationDispatchPlayBroker();

      expect(result).toStrictEqual(state);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();

      proxy.setupError();

      await expect(orchestrationDispatchPlayBroker()).rejects.toThrow(/^Failed to fetch$/u);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = orchestrationDispatchPlayBrokerProxy();

      proxy.setupInvalidResponse({ data: { state: { bad: 'data' } } });

      await expect(orchestrationDispatchPlayBroker()).rejects.toThrow(/invalid_/u);
    });
  });
});
