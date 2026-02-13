import { ProjectIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorAddQuestAdapter } from './orchestrator-add-quest-adapter';
import { orchestratorAddQuestAdapterProxy } from './orchestrator-add-quest-adapter.proxy';

describe('orchestratorAddQuestAdapter', () => {
  describe('successful add', () => {
    it('VALID: {title, userRequest, projectId} => returns add quest result', async () => {
      orchestratorAddQuestAdapterProxy();
      const projectId = ProjectIdStub();

      const result = await orchestratorAddQuestAdapter({
        title: 'Add Auth',
        userRequest: 'User wants authentication',
        projectId,
      });

      expect(result).toStrictEqual({
        success: true,
        questId: 'stub-quest',
        questFolder: '001-stub',
        filePath: '/stub',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorAddQuestAdapterProxy();
      const projectId = ProjectIdStub();

      proxy.throws({ error: new Error('Failed to add quest') });

      await expect(
        orchestratorAddQuestAdapter({
          title: 'Add Auth',
          userRequest: 'User wants authentication',
          projectId,
        }),
      ).rejects.toThrow(/Failed to add quest/u);
    });
  });
});
