import {
  claudeLineNormalizeBrokerProxy,
  fsMkdirAdapterProxy,
  osUserHomedirAdapterProxy,
  pathDirnameAdapterProxy,
} from '@dungeonmaster/shared/testing';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';

type GuildConfig = Parameters<ReturnType<typeof guildGetBrokerProxy>['setupConfig']>[0]['config'];

export const chatSubagentTailBrokerProxy = (): {
  setupGuild: (params: { config: GuildConfig; homeDir: string }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
} => {
  claudeLineNormalizeBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const tailProxy = fsWatchTailAdapterProxy();
  // The broker now mkdir + appends('') to ensure the sub-agent JSONL exists before
  // fs.watch is called — Claude CLI may not have created it yet for `run_in_background`
  // Tasks. These proxies are required by enforce-proxy-child-creation; default mocks are
  // installed by their factories (no per-test setup needed for the existing test cases).
  fsMkdirAdapterProxy();
  pathDirnameAdapterProxy();
  fsAppendFileAdapterProxy();

  return {
    setupGuild: ({ config, homeDir }: { config: GuildConfig; homeDir: string }): void => {
      guildProxy.setupConfig({ config });
      homedirProxy.returns({ path: homeDir });
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
