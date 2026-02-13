import type { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

import { projectListBrokerProxy } from '../../brokers/project/list/project-list-broker.proxy';

type ProjectListItem = ReturnType<typeof ProjectListItemStub>;

export const useProjectsBindingProxy = (): {
  setupProjects: (params: { projects: ProjectListItem[] }) => void;
  setupError: () => void;
} => {
  const brokerProxy = projectListBrokerProxy();

  return {
    setupProjects: ({ projects }: { projects: ProjectListItem[] }): void => {
      brokerProxy.setupProjects({ projects });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
  };
};
