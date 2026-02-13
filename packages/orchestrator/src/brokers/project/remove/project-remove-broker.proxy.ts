import type { ProjectConfig } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBrokerProxy } from '../../project-config/read/project-config-read-broker.proxy';
import { projectConfigWriteBrokerProxy } from '../../project-config/write/project-config-write-broker.proxy';

export const projectRemoveBrokerProxy = (): {
  setupConfig: (params: { config: ProjectConfig }) => void;
} => {
  const configReadProxy = projectConfigReadBrokerProxy();
  const configWriteProxy = projectConfigWriteBrokerProxy();

  return {
    setupConfig: ({ config }: { config: ProjectConfig }): void => {
      configReadProxy.setupConfig({ config });
      configWriteProxy.setupSuccess();
    },
  };
};
