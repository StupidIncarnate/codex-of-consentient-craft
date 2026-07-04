import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchPauseBroker } from './orchestration-dispatch-pause-broker';
import { orchestrationDispatchPauseBrokerProxy } from './orchestration-dispatch-pause-broker.proxy';

describe('orchestrationDispatchPauseBroker', () => {
  describe('successful pause', () => {
    it('VALID: {} => returns paused dispatch state from API', async () => {
      const proxy = orchestrationDispatchPauseBrokerProxy();
      const state = DispatchStateStub({ mode: 'paused' });

      proxy.setupState({ state });

      const result = await orchestrationDispatchPauseBroker();

      expect(result).toStrictEqual(state);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = orchestrationDispatchPauseBrokerProxy();

      proxy.setupError();

      await expect(orchestrationDispatchPauseBroker()).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = orchestrationDispatchPauseBrokerProxy();

      proxy.setupInvalidResponse({ data: { state: { bad: 'data' } } });

      await expect(orchestrationDispatchPauseBroker()).rejects.toThrow(/invalid_/u);
    });
  });
});
