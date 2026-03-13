import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRecoverActiveQuestsAdapter } from './orchestrator-recover-active-quests-adapter';
import { orchestratorRecoverActiveQuestsAdapterProxy } from './orchestrator-recover-active-quests-adapter.proxy';

describe('orchestratorRecoverActiveQuestsAdapter', () => {
  describe('successful recovery', () => {
    it('VALID: {} => returns recovered quest ids', async () => {
      const proxy = orchestratorRecoverActiveQuestsAdapterProxy();
      const questIds = [QuestIdStub({ value: 'quest-1' }), QuestIdStub({ value: 'quest-2' })];
      proxy.returns({ questIds });

      const result = await orchestratorRecoverActiveQuestsAdapter();

      expect(result).toStrictEqual(['quest-1', 'quest-2']);
    });

    it('EMPTY: {} => returns empty array when no quests to recover', async () => {
      orchestratorRecoverActiveQuestsAdapterProxy();

      const result = await orchestratorRecoverActiveQuestsAdapter();

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorRecoverActiveQuestsAdapterProxy();
      proxy.throws({ error: new Error('Recovery failed') });

      await expect(orchestratorRecoverActiveQuestsAdapter()).rejects.toThrow(/^Recovery failed$/u);
    });
  });
});
