import { installExecuteBrokerProxy } from '../execute/install-execute-broker.proxy';

export const installOrchestrateBrokerProxy = (): {
  setupImport: (params: { module: unknown }) => void;
} => {
  const installExecuteProxy = installExecuteBrokerProxy();

  return {
    setupImport: ({ module }: { module: unknown }): void => {
      installExecuteProxy.setupImport({ module });
    },
  };
};
