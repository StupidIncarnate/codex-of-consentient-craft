import {
  ProjectIdStub,
  ProjectNameStub,
  ProjectPathStub,
  ProjectStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorUpdateProjectAdapter } from './orchestrator-update-project-adapter';
import { orchestratorUpdateProjectAdapterProxy } from './orchestrator-update-project-adapter.proxy';

describe('orchestratorUpdateProjectAdapter', () => {
  describe('successful update', () => {
    it('VALID: {projectId, name, path} => returns updated project', async () => {
      const proxy = orchestratorUpdateProjectAdapterProxy();
      const projectId = ProjectIdStub();
      const name = ProjectNameStub({ value: 'Updated Project' });
      const path = ProjectPathStub({ value: '/home/user/updated' });
      const project = ProjectStub({ id: projectId, name, path });

      proxy.returns({ project });

      const result = await orchestratorUpdateProjectAdapter({ projectId, name, path });

      expect(result).toStrictEqual(project);
    });

    it('VALID: {projectId, name only} => returns updated project', async () => {
      orchestratorUpdateProjectAdapterProxy();
      const projectId = ProjectIdStub();
      const name = ProjectNameStub({ value: 'Renamed' });

      const result = await orchestratorUpdateProjectAdapter({ projectId, name });

      expect(result).toStrictEqual(ProjectStub());
    });

    it('VALID: {projectId, path only} => returns updated project', async () => {
      orchestratorUpdateProjectAdapterProxy();
      const projectId = ProjectIdStub();
      const path = ProjectPathStub({ value: '/new/path' });

      const result = await orchestratorUpdateProjectAdapter({ projectId, path });

      expect(result).toStrictEqual(ProjectStub());
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorUpdateProjectAdapterProxy();
      const projectId = ProjectIdStub();

      proxy.throws({ error: new Error('Failed to update project') });

      await expect(orchestratorUpdateProjectAdapter({ projectId })).rejects.toThrow(
        /Failed to update project/u,
      );
    });
  });
});
