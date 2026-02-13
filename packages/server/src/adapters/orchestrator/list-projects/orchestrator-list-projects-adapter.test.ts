import { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListProjectsAdapter } from './orchestrator-list-projects-adapter';
import { orchestratorListProjectsAdapterProxy } from './orchestrator-list-projects-adapter.proxy';

describe('orchestratorListProjectsAdapter', () => {
  describe('successful list', () => {
    it('VALID: {} => returns project list items', async () => {
      const proxy = orchestratorListProjectsAdapterProxy();
      const projects = [ProjectListItemStub()];

      proxy.returns({ projects });

      const result = await orchestratorListProjectsAdapter();

      expect(result).toStrictEqual(projects);
    });

    it('VALID: {no projects} => returns empty array', async () => {
      orchestratorListProjectsAdapterProxy();

      const result = await orchestratorListProjectsAdapter();

      expect(result).toStrictEqual([]);
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
