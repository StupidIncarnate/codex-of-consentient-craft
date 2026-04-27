import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestQueueAdapter } from './orchestrator-get-quest-queue-adapter';
import { orchestratorGetQuestQueueAdapterProxy } from './orchestrator-get-quest-queue-adapter.proxy';

describe('orchestratorGetQuestQueueAdapter', () => {
  describe('successful read', () => {
    it('VALID: {} => returns queue entries from orchestrator', async () => {
      const proxy = orchestratorGetQuestQueueAdapterProxy();
      const entry = QuestQueueEntryStub();
      proxy.returns({ entries: [entry] });

      const result = await orchestratorGetQuestQueueAdapter();

      expect(result).toStrictEqual([entry]);
    });

    it('EMPTY: {} => returns empty array when queue empty', async () => {
      orchestratorGetQuestQueueAdapterProxy();

      const result = await orchestratorGetQuestQueueAdapter();

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetQuestQueueAdapterProxy();
      proxy.throws({ error: new Error('Queue read failed') });

      await expect(orchestratorGetQuestQueueAdapter()).rejects.toThrow(/^Queue read failed$/u);
    });
  });
});
