import type { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

import { projectListBrokerProxy } from '../../brokers/project/list/project-list-broker.proxy';

type ProjectListItem = ReturnType<typeof ProjectListItemStub>;

export const useProjectsBindingProxy = (): {
  setupProjects: (params: { projects: ProjectListItem[] }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const brokerProxy = projectListBrokerProxy();

  return {
    setupProjects: ({ projects }: { projects: ProjectListItem[] }): void => {
      brokerProxy.setupProjects({ projects });
    },
    setupError: ({ error }: { error: Error }): void => {
      brokerProxy.setupError({ error });
    },
  };
};
