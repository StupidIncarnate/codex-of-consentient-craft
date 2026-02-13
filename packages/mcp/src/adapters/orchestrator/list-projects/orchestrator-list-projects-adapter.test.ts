import { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListProjectsAdapter } from './orchestrator-list-projects-adapter';
import { orchestratorListProjectsAdapterProxy } from './orchestrator-list-projects-adapter.proxy';

describe('orchestratorListProjectsAdapter', () => {
  describe('successful list', () => {
    it('VALID: no input => returns empty array', async () => {
      const proxy = orchestratorListProjectsAdapterProxy();

      proxy.returns({ projects: [] });

      const result = await orchestratorListProjectsAdapter();

      expect(result).toStrictEqual([]);
    });

    it('VALID: projects exist => returns project list items', async () => {
      const proxy = orchestratorListProjectsAdapterProxy();
      const project = ProjectListItemStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'My Project',
        path: '/home/user/my-project',
        valid: true,
        questCount: 3,
      });

      proxy.returns({ projects: [project] });

      const result = await orchestratorListProjectsAdapter();

      expect(result).toStrictEqual([project]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorListProjectsAdapterProxy();

      proxy.throws({ error: new Error('Failed to list projects') });

      await expect(orchestratorListProjectsAdapter()).rejects.toThrow(/Failed to list projects/u);
    });
  });
});
