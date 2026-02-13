jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

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
