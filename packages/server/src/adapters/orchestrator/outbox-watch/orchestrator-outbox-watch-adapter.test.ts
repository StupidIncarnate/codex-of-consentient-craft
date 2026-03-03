import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorOutboxWatchAdapter } from './orchestrator-outbox-watch-adapter';
import { orchestratorOutboxWatchAdapterProxy } from './orchestrator-outbox-watch-adapter.proxy';

describe('orchestratorOutboxWatchAdapter', () => {
  describe('successful watch', () => {
    it('VALID: {onQuestChanged, onError} => returns stop function', async () => {
      const proxy = orchestratorOutboxWatchAdapterProxy();
      const stopFn = jest.fn();
      proxy.returns({ stop: stopFn });

      const result = await orchestratorOutboxWatchAdapter({
        onQuestChanged: jest.fn(),
        onError: jest.fn(),
      });

      expect(result).toStrictEqual({ stop: stopFn });
    });

    it('VALID: {onQuestChanged callback} => captures and invokes onQuestChanged', async () => {
      const proxy = orchestratorOutboxWatchAdapterProxy();
      const onQuestChanged = jest.fn();

      await orchestratorOutboxWatchAdapter({
        onQuestChanged,
        onError: jest.fn(),
      });

      const callbacks = proxy.getCapturedCallbacks();
      const questId = QuestIdStub({ value: 'test-quest' });
      callbacks.onQuestChanged?.({ questId });

      expect(onQuestChanged).toHaveBeenCalledWith({ questId });
    });
  });

  describe('error cases', () => {
    it('ERROR: {broker throws} => throws error', async () => {
      const proxy = orchestratorOutboxWatchAdapterProxy();
      proxy.throws({ error: new Error('Watch failed') });

      await expect(
        orchestratorOutboxWatchAdapter({
          onQuestChanged: jest.fn(),
          onError: jest.fn(),
        }),
      ).rejects.toThrow(/^Watch failed$/u);
    });
  });
});
