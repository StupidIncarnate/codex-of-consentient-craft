import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';

type GuildConfig = Parameters<ReturnType<typeof guildGetBrokerProxy>['setupConfig']>[0]['config'];

export const chatHistoryReplayBrokerProxy = (): {
  setupGuild: (params: { config: GuildConfig; homeDir: string }) => void;
  setupMainSession: (params: { content: string }) => void;
  setupSubagentDir: (params: { files: FileName[] }) => void;
  setupSubagentFile: (params: { content: string }) => void;
  setupSubagentDirMissing: () => void;
} => {
  const guildProxy = guildGetBrokerProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const readJsonlProxy = fsReadJsonlAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();

  return {
    setupGuild: ({ config, homeDir }: { config: GuildConfig; homeDir: string }): void => {
      guildProxy.setupConfig({ config });
      homedirProxy.returns({ path: homeDir });
    },
    setupMainSession: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({ content });
    },
    setupSubagentDir: ({ files }: { files: FileName[] }): void => {
      readdirProxy.returns({ files });
    },
    setupSubagentFile: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({ content });
    },
    setupSubagentDirMissing: (): void => {
      readdirProxy.throws({ error: new Error('ENOENT: no such file or directory') });
    },
  };
};
