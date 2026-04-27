import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  claudeLineNormalizeBrokerProxy,
  cwdResolveBrokerProxy,
  osUserHomedirAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FileName } from '@dungeonmaster/shared/contracts';
import { repoRootCwdContract } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
  setupCwdResolveSuccess: (params: { cwd: string }) => void;
  setupCwdResolveReject: (params: { error: Error }) => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const readJsonlProxy = fsReadJsonlAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();

  // chat-history-replay-broker walks up from the guild path to the repo root via
  // cwdResolveBroker so the encoded JSONL path matches the spawn cwd of the agent that
  // wrote the session. Default to returning the guild path itself, matching the broker's
  // behavior in standalone projects with no `.dungeonmaster.json` ancestor.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });
  cwdResolveMock.mockResolvedValue(repoRootCwdContract.parse('/home/user/my-project'));

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
    setupCwdResolveSuccess: ({ cwd }: { cwd: string }): void => {
      cwdResolveMock.mockResolvedValue(repoRootCwdContract.parse(cwd));
    },
    setupCwdResolveReject: ({ error }: { error: Error }): void => {
      cwdResolveMock.mockImplementation(() => {
        throw error;
      });
    },
  };
};
