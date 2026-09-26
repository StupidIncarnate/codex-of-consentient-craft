import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { duplicateInstallCheckBroker } from '../../duplicate-install/check/duplicate-install-check-broker';
import { duplicateInstallCheckBrokerProxy } from '../../duplicate-install/check/duplicate-install-check-broker.proxy';
import type { DuplicateInstallViolation } from '../../../contracts/duplicate-install-violation/duplicate-install-violation-contract';

export const commandDedupeCheckBrokerProxy = (): {
  setupViolations: (params: {
    rootPath: AbsoluteFilePath;
    violations: readonly DuplicateInstallViolation[];
  }) => void;
} => {
  const handle = registerMock({ fn: duplicateInstallCheckBroker });
  // The real check is exercised end to end by its own fixture tests; here it is mocked outright,
  // constructed only to satisfy enforce-proxy-child-creation.
  duplicateInstallCheckBrokerProxy();

  return {
    setupViolations: ({
      rootPath,
      violations,
    }: {
      rootPath: AbsoluteFilePath;
      violations: readonly DuplicateInstallViolation[];
    }): void => {
      handle.calledWith([{ rootPath }]).resolves(violations);
    },
  };
};
