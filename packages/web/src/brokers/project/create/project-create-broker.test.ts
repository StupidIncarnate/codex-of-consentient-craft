import { ProjectIdStub } from '@dungeonmaster/shared/contracts';

import { projectCreateBroker } from './project-create-broker';
import { projectCreateBrokerProxy } from './project-create-broker.proxy';

describe('projectCreateBroker', () => {
  describe('successful creation', () => {
    it('VALID: {name, path} => returns project id', async () => {
      const proxy = projectCreateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupCreate({ id: projectId });

      const result = await projectCreateBroker({
        name: 'My Project',
        path: '/home/user/my-project',
      });

      expect(result).toStrictEqual({ id: projectId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = projectCreateBrokerProxy();

      proxy.setupError();

      await expect(
        projectCreateBroker({
          name: 'My Project',
          path: '/home/user/my-project',
        }),
      ).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = projectCreateBrokerProxy();

      proxy.setupInvalidResponse({ data: { id: '' } });

      await expect(
        projectCreateBroker({
          name: 'My Project',
          path: '/home/user/my-project',
        }),
      ).rejects.toThrow(/invalid_string/u);
    });
  });
});
