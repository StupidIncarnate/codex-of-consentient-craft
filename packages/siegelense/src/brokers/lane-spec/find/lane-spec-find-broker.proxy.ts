import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';
import type { DevServerE2eProcess } from '@dungeonmaster/config';
import { configResolveBrokerProxy } from '@dungeonmaster/config/startup/start-config.proxy';

// The broker builds startPath as a template string, `${cwd()}/${projectConfigFile}` — never
// `join`. `cwdProxy().setupCwd` stages the fixed value this file's every resolution needs to agree
// on, and this proxy computes `startPath` from that SAME literal directly, never by calling `cwd()`
// a second time.
//
// Composes config's own black-box caller proxy (F18) rather than mocking configResolveBroker
// directly here, and rather than composing config's colocated config-resolve-broker.proxy: that
// proxy mocks configResolveBroker's OWN internal dependencies, one of which
// (@dungeonmaster/shared's configRootFindBroker) several OTHER siegelense proxies wire this
// broker in as a lint-only child of (instance-start-broker, profile-read-broker,
// profile-sample-record-broker, siegelense-driver-responder) — composing the granular proxy here
// globally mocks that shared broker for every one of THEIR test files too (registerMock's hoisted
// jest.mock() has no per-test-case granularity), breaking whatever real path resolution each of
// those relies on even though none of them ever calls a method on this proxy.
export const laneSpecFindBrokerProxy = (): {
  setupConfiguredProcesses: (params: { processes: readonly DevServerE2eProcess[] }) => void;
  setupE2eAbsent: () => void;
  setupDevServerAbsent: () => void;
} => {
  const CWD_PATH_VALUE = '/default/cwd';
  const cwdStagingProxy = cwdProxy();
  cwdStagingProxy.setupCwd({ value: CWD_PATH_VALUE });
  const configProxy = configResolveBrokerProxy();

  const startPath = filePathContract.parse(
    `${CWD_PATH_VALUE}/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
  );

  // Sticky default: a single headless api process, so any caller composing this proxy without
  // addressing it still resolves a real, valid LaneSpec — setupConfiguredProcesses below is a live
  // override on the SAME address, per registerMock's own "later registration wins" rule.
  configProxy.setupResolves({
    filePath: startPath,
    config: DungeonmasterConfigStub({
      devServer: {
        devCommand: 'npm run dev',
        port: 3738,
        e2e: {
          processes: [
            {
              name: 'api',
              command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
              portRole: 'api',
              readyPath: '/api/guilds',
            },
          ],
        },
      },
    }),
  });

  return {
    setupConfiguredProcesses: ({
      processes,
    }: {
      processes: readonly DevServerE2eProcess[];
    }): void => {
      configProxy.setupResolves({
        filePath: startPath,
        config: DungeonmasterConfigStub({
          devServer: { devCommand: 'npm run dev', port: 3738, e2e: { processes: [...processes] } },
        }),
      });
    },

    setupE2eAbsent: (): void => {
      configProxy.setupResolves({
        filePath: startPath,
        config: DungeonmasterConfigStub({
          devServer: { devCommand: 'npm run dev', port: 3738 },
        }),
      });
    },

    setupDevServerAbsent: (): void => {
      configProxy.setupResolves({ filePath: startPath, config: DungeonmasterConfigStub() });
    },
  };
};
