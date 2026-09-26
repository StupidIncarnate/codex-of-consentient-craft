import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

import { commandDedupeCheckBroker } from '../../../brokers/command/dedupe-check/command-dedupe-check-broker';
import { commandDedupeCheckBrokerProxy } from '../../../brokers/command/dedupe-check/command-dedupe-check-broker.proxy';

export const WardDedupeResponderProxy = (): {
  setupRun: (params: { rootPath: AbsoluteFilePath; result: AdapterResult }) => void;
} => {
  const handle = registerMock({ fn: commandDedupeCheckBroker });
  // The command broker is mocked outright here; constructed only to satisfy
  // enforce-proxy-child-creation.
  commandDedupeCheckBrokerProxy();

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
