jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { ProjectStub } from '@dungeonmaster/shared/contracts';

type Project = ReturnType<typeof ProjectStub>;

export const orchestratorAddProjectAdapterProxy = (): {
  returns: (params: { project: Project }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.addProject);

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
