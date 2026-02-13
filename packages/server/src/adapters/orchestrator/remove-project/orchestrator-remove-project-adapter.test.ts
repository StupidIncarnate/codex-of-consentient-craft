import { ProjectIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRemoveProjectAdapter } from './orchestrator-remove-project-adapter';
import { orchestratorRemoveProjectAdapterProxy } from './orchestrator-remove-project-adapter.proxy';

describe('orchestratorRemoveProjectAdapter', () => {
  describe('successful remove', () => {
    it('VALID: {projectId} => returns void', async () => {
      orchestratorRemoveProjectAdapterProxy();
      const projectId = ProjectIdStub();

      await expect(orchestratorRemoveProjectAdapter({ projectId })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorRemoveProjectAdapterProxy();
      const projectId = ProjectIdStub();

      proxy.throws({ error: new Error('Failed to remove project') });

      await expect(orchestratorRemoveProjectAdapter({ projectId })).rejects.toThrow(
        /Failed to remove project/u,
      );
    });
  });
});
