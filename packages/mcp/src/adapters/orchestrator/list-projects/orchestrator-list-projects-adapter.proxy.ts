/**
 * PURPOSE: Proxy for orchestrator-list-projects-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorListProjectsAdapterProxy();
 * proxy.returns({ projects: [ProjectListItemStub()] });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

jest.mock('@dungeonmaster/orchestrator');

type ProjectListItem = ReturnType<typeof ProjectListItemStub>;

export const orchestratorListProjectsAdapterProxy = (): {
  returns: (params: { projects: ProjectListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.listProjects);

  mock.mockResolvedValue([]);

  return {
    returns: ({ projects }: { projects: ProjectListItem[] }): void => {
      mock.mockResolvedValueOnce(projects);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
