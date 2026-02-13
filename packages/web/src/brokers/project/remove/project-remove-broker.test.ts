import { ProjectIdStub } from '@dungeonmaster/shared/contracts';

import { projectRemoveBroker } from './project-remove-broker';
import { projectRemoveBrokerProxy } from './project-remove-broker.proxy';

describe('projectRemoveBroker', () => {
  describe('successful removal', () => {
    it('VALID: {projectId} => resolves without error', async () => {
      const proxy = projectRemoveBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupRemove();

      await expect(projectRemoveBroker({ projectId })).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = projectRemoveBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      await expect(projectRemoveBroker({ projectId })).rejects.toThrow(/fetch/iu);
    });
  });
});
