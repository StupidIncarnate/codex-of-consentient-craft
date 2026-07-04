import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchGetBroker } from './orchestration-dispatch-get-broker';
import { orchestrationDispatchGetBrokerProxy } from './orchestration-dispatch-get-broker.proxy';

describe('orchestrationDispatchGetBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {paused state} => returns dispatch state from API', async () => {
      const proxy = orchestrationDispatchGetBrokerProxy();
      const state = DispatchStateStub({ mode: 'paused' });

      proxy.setupState({ state });

      const result = await orchestrationDispatchGetBroker();

      expect(result).toStrictEqual(state);
    });

    it('VALID: {node-playing state with heartbeat} => returns dispatch state from API', async () => {
      const proxy = orchestrationDispatchGetBrokerProxy();
      const state = DispatchStateStub({
        mode: 'node-playing',
        mcpHeartbeatAt: '2024-01-15T10:05:00.000Z' as never,
      });

      proxy.setupState({ state });

      const result = await orchestrationDispatchGetBroker();

      expect(result).toStrictEqual(state);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = orchestrationDispatchGetBrokerProxy();

      proxy.setupError();

      await expect(orchestrationDispatchGetBroker()).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = orchestrationDispatchGetBrokerProxy();

      proxy.setupInvalidResponse({ data: { state: { bad: 'data' } } });

      await expect(orchestrationDispatchGetBroker()).rejects.toThrow(/invalid_/u);
    });
  });
});
