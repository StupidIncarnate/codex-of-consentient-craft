import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { platformCrossingCheckBroker } from '../../platform-crossing/check/platform-crossing-check-broker';
import { platformCrossingCheckBrokerProxy } from '../../platform-crossing/check/platform-crossing-check-broker.proxy';
import type { PlatformCrossingViolation } from '../../../contracts/platform-crossing-violation/platform-crossing-violation-contract';

export const commandPlatformCheckBrokerProxy = (): {
  setupViolations: (params: {
    rootPath: AbsoluteFilePath;
    violations: readonly PlatformCrossingViolation[];
  }) => void;
} => {
  const handle = registerMock({ fn: platformCrossingCheckBroker });
  // The real check is exercised end to end by its own fixture tests; here it is mocked outright,
  // constructed only to satisfy enforce-proxy-child-creation.
  platformCrossingCheckBrokerProxy();

  return {
    setupViolations: ({
      rootPath,
      violations,
    }: {
      rootPath: AbsoluteFilePath;
      violations: readonly PlatformCrossingViolation[];
    }): void => {
      handle.calledWith([{ rootPath }]).resolves(violations);
    },
  };
};
