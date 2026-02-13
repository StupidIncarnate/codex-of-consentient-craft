import type { ProjectConfig } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBrokerProxy } from '../../project-config/read/project-config-read-broker.proxy';

export const projectGetBrokerProxy = (): {
  setupConfig: (params: { config: ProjectConfig }) => void;
} => {
  const configReadProxy = projectConfigReadBrokerProxy();

  return {
    setupConfig: ({ config }: { config: ProjectConfig }): void => {
      configReadProxy.setupConfig({ config });
    },
  };
};
