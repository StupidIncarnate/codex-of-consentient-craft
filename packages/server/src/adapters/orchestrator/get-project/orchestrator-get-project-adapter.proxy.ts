jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { ProjectStub } from '@dungeonmaster/shared/contracts';

type Project = ReturnType<typeof ProjectStub>;

export const orchestratorGetProjectAdapterProxy = (): {
  returns: (params: { project: Project }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.getProject);

  mock.mockResolvedValue(ProjectStub());

  return {
    returns: ({ project }: { project: Project }): void => {
      mock.mockResolvedValueOnce(project);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
