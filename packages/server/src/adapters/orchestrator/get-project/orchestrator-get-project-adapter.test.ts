import { ProjectIdStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetProjectAdapter } from './orchestrator-get-project-adapter';
import { orchestratorGetProjectAdapterProxy } from './orchestrator-get-project-adapter.proxy';

describe('orchestratorGetProjectAdapter', () => {
  describe('successful get', () => {
    it('VALID: {projectId} => returns project', async () => {
      const proxy = orchestratorGetProjectAdapterProxy();
      const projectId = ProjectIdStub();
      const project = ProjectStub({ id: projectId });

      proxy.returns({ project });

      const result = await orchestratorGetProjectAdapter({ projectId });

      expect(result).toStrictEqual(project);
    });

    it('VALID: {projectId} => returns project with defaults', async () => {
      orchestratorGetProjectAdapterProxy();
      const projectId = ProjectIdStub();

      const result = await orchestratorGetProjectAdapter({ projectId });

      expect(result).toStrictEqual(ProjectStub());
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetProjectAdapterProxy();
      const projectId = ProjectIdStub();

      proxy.throws({ error: new Error('Project not found') });

      await expect(orchestratorGetProjectAdapter({ projectId })).rejects.toThrow(
        /Project not found/u,
      );
    });
  });
});
