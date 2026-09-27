import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { DungeonmasterConfigStub } from '@dungeonmaster/config';
import { configResolveBrokerProxy } from '@dungeonmaster/config/config-resolve-caller.proxy';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

// The broker builds startPath as pathJoinAdapter([processCwdAdapter(), projectConfigFile]).
// pathJoinAdapterProxy() defaults to a real '/'-join and processCwdAdapterProxy() defaults to
// '/default/cwd' (both from @dungeonmaster/shared/testing), so this is the exact, real address
// configResolveBroker is called with.
const CONFIG_START_PATH = FilePathStub({
  value: `/default/cwd/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
});

export const orchestrationModeGetBrokerProxy = (): {
  setupMode: (params: { mode: OrchestrationMode }) => void;
  setupConfigNotFound: () => void;
  setupConfigError: (params: { error: Error }) => void;
} => {
  pathJoinAdapterProxy();
  processCwdAdapterProxy();
  // Composes config's own black-box caller proxy (F18) rather than mocking configResolveBroker
  // directly here, and rather than composing config's colocated config-resolve-broker.proxy:
  // that proxy mocks configResolveBroker's OWN internal dependencies, one of which
  // (@dungeonmaster/shared's configRootFindBroker) is a broker this package's own quest/guild
  // path resolution also calls for real — composing it here globally mocks that shared broker
  // for the whole test FILE (registerMock's hoisted jest.mock() has no per-test-case
  // granularity), breaking any other real path resolution the same file relies on. Traced by
  // reproducing it: quest-orchestration-loop-broker.test.ts's whole suite started failing with
  // "Quest not found" once its own proxy composed that same chain.
  const configProxy = configResolveBrokerProxy();

  return {
    setupMode: ({ mode }: { mode: OrchestrationMode }): void => {
      configProxy.setupResolves({
        filePath: CONFIG_START_PATH,
        config: DungeonmasterConfigStub({ orchestrationMode: mode }),
      });
    },
    setupConfigNotFound: (): void => {
      configProxy.setupConfigNotFound({ filePath: CONFIG_START_PATH });
    },
    setupConfigError: ({ error }: { error: Error }): void => {
      configProxy.setupConfigMalformed({ filePath: CONFIG_START_PATH, message: error.message });
    },
  };
};
