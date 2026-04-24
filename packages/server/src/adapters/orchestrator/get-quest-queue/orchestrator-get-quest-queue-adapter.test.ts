import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestQueueAdapter } from './orchestrator-get-quest-queue-adapter';
import { orchestratorGetQuestQueueAdapterProxy } from './orchestrator-get-quest-queue-adapter.proxy';

describe('orchestratorGetQuestQueueAdapter', () => {
  describe('successful read', () => {
    it('VALID: {} => returns queue entries from orchestrator', () => {
      const proxy = orchestratorGetQuestQueueAdapterProxy();
      const entry = QuestQueueEntryStub();
      proxy.returns({ entries: [entry] });

      const result = orchestratorGetQuestQueueAdapter();

      expect(result).toStrictEqual([entry]);
    });

    it('EMPTY: {} => returns empty array when queue empty', () => {
      orchestratorGetQuestQueueAdapterProxy();

      const result = orchestratorGetQuestQueueAdapter();

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorGetQuestQueueAdapterProxy();
      proxy.throws({ error: new Error('Queue read failed') });

      expect(() => orchestratorGetQuestQueueAdapter()).toThrow(/^Queue read failed$/u);
    });
  });
});
