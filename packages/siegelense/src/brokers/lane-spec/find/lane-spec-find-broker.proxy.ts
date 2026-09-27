import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { configResolveBroker, DungeonmasterConfigStub } from '@dungeonmaster/config';
import type { DevServerE2eProcess } from '@dungeonmaster/config';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// The broker builds startPath as a template string, `${processCwdAdapter()}/${projectConfigFile}`
// — never `pathJoinAdapter`, whose mock is a call-ordered queue several OTHER proxies in this
// package already share for their own path joins (see the broker's own header). Reading
// processCwdAdapter() here, after processCwdAdapterProxy()'s sticky real-passthrough default is
// staged, reaches the exact, real address configResolveBroker is called with.
//
// Mocks configResolveBroker directly, rather than composing config's own colocated
// config-resolve-broker.proxy: that proxy mocks configResolveBroker's OWN internal dependencies,
// one of which (@dungeonmaster/shared's configRootFindBroker) several OTHER siegelense proxies
// wire this broker in as a lint-only child of (instance-start-broker, profile-read-broker,
// profile-sample-record-broker, siegelense-driver-responder) — composing the granular proxy here
// globally mocks that shared broker for every one of THEIR test files too (registerMock's hoisted
// jest.mock() has no per-test-case granularity), breaking whatever real path resolution each of
// those relies on even though none of them ever calls a method on this proxy.
export const laneSpecFindBrokerProxy = (): {
  setupConfiguredProcesses: (params: { processes: readonly DevServerE2eProcess[] }) => void;
  setupE2eAbsent: () => void;
  setupDevServerAbsent: () => void;
} => {
  processCwdAdapterProxy();
  const handle = registerMock({ fn: configResolveBroker });

  const startPath = filePathContract.parse(
    `${processCwdAdapter()}/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
  );

  // Sticky default: a single headless api process, so any caller composing this proxy without
  // addressing it still resolves a real, valid LaneSpec — setupConfiguredProcesses below is a live
  // override on the SAME address, per registerMock's own "later registration wins" rule.
  handle.calledWith([{ filePath: startPath }]).resolves(
    DungeonmasterConfigStub({
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
  );

  return {
    setupConfiguredProcesses: ({
      processes,
    }: {
      processes: readonly DevServerE2eProcess[];
    }): void => {
      handle.calledWith([{ filePath: startPath }]).resolves(
        DungeonmasterConfigStub({
          devServer: { devCommand: 'npm run dev', port: 3738, e2e: { processes: [...processes] } },
        }),
      );
    },

    setupE2eAbsent: (): void => {
      handle.calledWith([{ filePath: startPath }]).resolves(
        DungeonmasterConfigStub({
          devServer: { devCommand: 'npm run dev', port: 3738 },
        }),
      );
    },

    setupDevServerAbsent: (): void => {
      handle.calledWith([{ filePath: startPath }]).resolves(DungeonmasterConfigStub());
    },
  };
};
