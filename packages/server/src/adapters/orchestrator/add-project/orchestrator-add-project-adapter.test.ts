import { ProjectNameStub, ProjectPathStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { orchestratorAddProjectAdapter } from './orchestrator-add-project-adapter';
import { orchestratorAddProjectAdapterProxy } from './orchestrator-add-project-adapter.proxy';

describe('orchestratorAddProjectAdapter', () => {
  describe('successful add', () => {
    it('VALID: {name, path} => returns project', async () => {
      const proxy = orchestratorAddProjectAdapterProxy();
      const name = ProjectNameStub({ value: 'My Project' });
      const path = ProjectPathStub({ value: '/home/user/my-project' });
      const project = ProjectStub({ name, path });

      proxy.returns({ project });

      const result = await orchestratorAddProjectAdapter({ name, path });

      expect(result).toStrictEqual(project);
    });

    it('VALID: {name, path} => returns project with defaults', async () => {
      orchestratorAddProjectAdapterProxy();
      const name = ProjectNameStub();
      const path = ProjectPathStub();

      const result = await orchestratorAddProjectAdapter({ name, path });

      expect(result).toStrictEqual(ProjectStub());
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorAddProjectAdapterProxy();
      const name = ProjectNameStub();
      const path = ProjectPathStub();

      proxy.throws({ error: new Error('Failed to add project') });

      await expect(orchestratorAddProjectAdapter({ name, path })).rejects.toThrow(
        /Failed to add project/u,
      );
    });
  });
});
