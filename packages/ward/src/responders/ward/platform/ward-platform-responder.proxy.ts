import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

import { commandPlatformCheckBroker } from '../../../brokers/command/platform-check/command-platform-check-broker';
import { commandPlatformCheckBrokerProxy } from '../../../brokers/command/platform-check/command-platform-check-broker.proxy';

export const WardPlatformResponderProxy = (): {
  setupRun: (params: { rootPath: AbsoluteFilePath; result: AdapterResult }) => void;
} => {
  const handle = registerMock({ fn: commandPlatformCheckBroker });
  // The command broker is mocked outright here; constructed only to satisfy
  // enforce-proxy-child-creation.
  commandPlatformCheckBrokerProxy();

  return {
    setupRun: ({
      rootPath,
      result,
    }: {
      rootPath: AbsoluteFilePath;
      result: AdapterResult;
    }): void => {
      handle.calledWith([{ rootPath }]).resolves(result);
    },
  };
};
