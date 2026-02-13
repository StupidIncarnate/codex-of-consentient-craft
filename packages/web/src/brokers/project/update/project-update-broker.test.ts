import { ProjectIdStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { projectUpdateBroker } from './project-update-broker';
import { projectUpdateBrokerProxy } from './project-update-broker.proxy';

describe('projectUpdateBroker', () => {
  describe('successful update', () => {
    it('VALID: {projectId, modifications} => returns updated project', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const project = ProjectStub({ id: projectId, name: 'Updated Name' });

      proxy.setupUpdate({ project });

      const result = await projectUpdateBroker({
        projectId,
        modifications: { name: 'Updated Name' },
      });

      expect(result).toStrictEqual(project);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError({ error: new Error('Failed to update project') });

      await expect(
        projectUpdateBroker({
          projectId,
          modifications: { name: 'Updated Name' },
        }),
      ).rejects.toThrow('Failed to update project');
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupInvalidResponse({ data: { bad: 'data' } });

      await expect(
        projectUpdateBroker({
          projectId,
          modifications: { name: 'Updated Name' },
        }),
      ).rejects.toThrow(/invalid_type/u);
    });
  });
});
