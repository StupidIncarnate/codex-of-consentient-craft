import { ProjectIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questCreateBroker } from './quest-create-broker';
import { questCreateBrokerProxy } from './quest-create-broker.proxy';

describe('questCreateBroker', () => {
  describe('successful creation', () => {
    it('VALID: {projectId, title, userRequest} => returns quest id', async () => {
      const proxy = questCreateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const questId = QuestIdStub({ value: 'new-quest-123' });

      proxy.setupCreate({ id: questId });

      const result = await questCreateBroker({
        projectId,
        title: 'Add Auth',
        userRequest: 'Implement authentication',
      });

      expect(result).toStrictEqual({ id: questId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questCreateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      await expect(
        questCreateBroker({
          projectId,
          title: 'Add Auth',
          userRequest: 'Implement authentication',
        }),
      ).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = questCreateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupInvalidResponse({ data: { id: '' } });

      await expect(
        questCreateBroker({
          projectId,
          title: 'Add Auth',
          userRequest: 'Implement authentication',
        }),
      ).rejects.toThrow(/too_small/u);
    });
  });
});
