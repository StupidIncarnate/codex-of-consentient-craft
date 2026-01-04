import { installExecuteBrokerProxy } from '../execute/install-execute-broker.proxy';

export const installOrchestrateBrokerProxy = (): {
  installExecuteProxy: ReturnType<typeof installExecuteBrokerProxy>;
} => {
  const installExecuteProxy = installExecuteBrokerProxy();

  return {
    installExecuteProxy,
  };
};
