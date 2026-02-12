import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { orchestratorVerifyQuestAdapter } from './orchestrator-verify-quest-adapter';
import { orchestratorVerifyQuestAdapterProxy } from './orchestrator-verify-quest-adapter.proxy';

describe('orchestratorVerifyQuestAdapter', () => {
  describe('successful verify', () => {
    it('VALID: {questId, startPath} => returns verify quest result', async () => {
      orchestratorVerifyQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      const result = await orchestratorVerifyQuestAdapter({
        questId: 'test-quest',
        startPath,
      });

      expect(result).toStrictEqual({ success: true, checks: [] });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorVerifyQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.throws({ error: new Error('Failed to verify quest') });

      await expect(
        orchestratorVerifyQuestAdapter({ questId: 'test-quest', startPath }),
      ).rejects.toThrow(/Failed to verify quest/u);
    });
  });
});
