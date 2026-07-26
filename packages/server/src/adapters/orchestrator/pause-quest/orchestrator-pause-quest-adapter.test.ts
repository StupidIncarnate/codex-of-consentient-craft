import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorPauseQuestAdapter } from './orchestrator-pause-quest-adapter';
import { orchestratorPauseQuestAdapterProxy } from './orchestrator-pause-quest-adapter.proxy';

describe('orchestratorPauseQuestAdapter', () => {
  describe('successful pause', () => {
    it('VALID: {questId} => returns paused result', async () => {
      const proxy = orchestratorPauseQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      proxy.returns({ questId, paused: true });

      const result = await orchestratorPauseQuestAdapter({ questId });

      expect(result).toStrictEqual({ paused: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorPauseQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      proxy.throws({ questId, error: new Error('Failed to pause quest') });

      await expect(orchestratorPauseQuestAdapter({ questId })).rejects.toThrow(
        /Failed to pause quest/u,
      );
    });
  });
});
