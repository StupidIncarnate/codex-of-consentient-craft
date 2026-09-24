import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import type { DevServerE2eProcess } from '@dungeonmaster/config';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';

// The broker builds startPath as a template string, `${processCwdAdapter()}/${projectConfigFile}`
// — never `pathJoinAdapter`, whose mock is a call-ordered queue several OTHER proxies in this
// package already share for their own path joins (see the broker's own header). Reading
// processCwdAdapter() here, after processCwdAdapterProxy()'s sticky real-passthrough default is
// staged, reaches the exact, real address dungeonmasterConfigResolveAdapter is called with.
export const laneSpecFindBrokerProxy = (): {
  setupConfiguredProcesses: (params: { processes: readonly DevServerE2eProcess[] }) => void;
  setupE2eAbsent: () => void;
  setupDevServerAbsent: () => void;
} => {
  processCwdAdapterProxy();
  const configProxy = dungeonmasterConfigResolveAdapterProxy();

  const startPath = filePathContract.parse(
    `${processCwdAdapter()}/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
  );

  // Sticky default: a single headless api process, so any caller composing this proxy without
  // addressing it still resolves a real, valid LaneSpec — setupConfiguredProcesses below is a live
  // override on the SAME address, per registerMock's own "later registration wins" rule.
  configProxy.setupConfigResolved({
    startPath,
    config: configProxy.makeConfigWithArgs({
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
    } as never),
  });

  return {
    setupConfiguredProcesses: ({
      processes,
    }: {
      processes: readonly DevServerE2eProcess[];
    }): void => {
      configProxy.setupConfigResolved({
        startPath,
        config: configProxy.makeConfigWithArgs({
          devServer: { devCommand: 'npm run dev', port: 3738, e2e: { processes } },
        } as never),
      });
    },

    setupE2eAbsent: (): void => {
      configProxy.setupConfigResolved({
        startPath,
        config: configProxy.makeConfigWithArgs({
          devServer: { devCommand: 'npm run dev', port: 3738 },
        } as never),
      });
    },

    setupDevServerAbsent: (): void => {
      configProxy.setupConfigResolved({ startPath, config: configProxy.makeRealConfig() });
    },
  };
};
