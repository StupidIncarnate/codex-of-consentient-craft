import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { PlatformCrossingViolation } from '../../../contracts/platform-crossing-violation/platform-crossing-violation-contract';
import type { DuplicateInstallViolation } from '../../../contracts/duplicate-install-violation/duplicate-install-violation-contract';
import { platformCrossingCheckBroker } from '../../platform-crossing/check/platform-crossing-check-broker';
import { platformCrossingCheckBrokerProxy } from '../../platform-crossing/check/platform-crossing-check-broker.proxy';
import { duplicateInstallCheckBroker } from '../../duplicate-install/check/duplicate-install-check-broker';
import { duplicateInstallCheckBrokerProxy } from '../../duplicate-install/check/duplicate-install-check-broker.proxy';

export const platformDedupeCheckLayerBrokerProxy = (): {
  setupClean: (params: { rootPath: string }) => void;
  // Both handles are staged in the SAME call — never split across two calls — because both checks
  // run unconditionally in a `Promise.all`, so a call this proxy did not stage a response for
  // throws unconditionally. Staging them one call at a time would let a second call's default
  // (empty) response for the OTHER check silently overwrite the first call's staging for it.
  setupViolations: (params: {
    rootPath: string;
    platformViolations?: readonly PlatformCrossingViolation[];
    duplicateViolations?: readonly DuplicateInstallViolation[];
  }) => void;
} => {
  // Both checks are exercised end to end by their own fixture tests; here each is mocked outright,
  // exactly as `commandPlatformCheckBrokerProxy`/`commandDedupeCheckBrokerProxy` already do for the
  // subcommand layer this item deletes — this layer composes the same two checks the same way.
  const platformHandle = registerMock({ fn: platformCrossingCheckBroker });
  const duplicateHandle = registerMock({ fn: duplicateInstallCheckBroker });
  platformCrossingCheckBrokerProxy();
  duplicateInstallCheckBrokerProxy();

  const setupViolations = ({
    rootPath,
    platformViolations = [],
    duplicateViolations = [],
  }: {
    rootPath: string;
    platformViolations?: readonly PlatformCrossingViolation[];
    duplicateViolations?: readonly DuplicateInstallViolation[];
  }): void => {
    platformHandle.calledWith([{ rootPath }]).resolves(platformViolations);
    duplicateHandle.calledWith([{ rootPath }]).resolves(duplicateViolations);
  };

  return {
    setupClean: ({ rootPath }: { rootPath: string }): void => {
      setupViolations({ rootPath });
    },
    setupViolations,
  };
};
