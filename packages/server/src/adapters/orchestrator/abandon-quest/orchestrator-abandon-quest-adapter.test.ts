import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorAbandonQuestAdapter } from './orchestrator-abandon-quest-adapter';
import { orchestratorAbandonQuestAdapterProxy } from './orchestrator-abandon-quest-adapter.proxy';

describe('orchestratorAbandonQuestAdapter', () => {
  describe('successful abandon', () => {
    it('VALID: {questId} => returns abandoned result', async () => {
      orchestratorAbandonQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      const result = await orchestratorAbandonQuestAdapter({ questId });

      expect(result).toStrictEqual({ abandoned: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorAbandonQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      proxy.throws({ error: new Error('Failed to abandon quest') });

      await expect(orchestratorAbandonQuestAdapter({ questId })).rejects.toThrow(
        /Failed to abandon quest/u,
      );
    });
  });
});
