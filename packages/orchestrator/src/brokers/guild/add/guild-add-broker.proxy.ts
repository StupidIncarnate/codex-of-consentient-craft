import {
  dungeonmasterHomeEnsureBrokerProxy,
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath, GuildConfig } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';
import { guildConfigWriteBrokerProxy } from '../../guild-config/write/guild-config-write-broker.proxy';

export const guildAddBrokerProxy = (): {
  setupAddGuild: (params: {
    existingConfig: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildsPath: FilePath;
    guildDirPath: FilePath;
    questsDirPath: FilePath;
  }) => void;
  setupAddGuildInSuppliedHome: (params: {
    existingConfig: GuildConfig;
    configFilePath: FilePath;
  }) => void;
  setupDuplicatePath: (params: { existingConfig: GuildConfig }) => void;
  stageGeneratedId: (params: { id: string }) => void;
  dirsCreated: () => readonly unknown[];
  configFilesWritten: () => readonly unknown[];
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const configWriteProxy = guildConfigWriteBrokerProxy();
  const homeEnsureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  // crypto.randomUUID and Date.prototype.toISOString take no identifying argument — [] is
  // the honest address for both.
  const randomUuidHandle = registerSpyOn({ object: crypto, method: 'randomUUID' });
  randomUuidHandle.calledWith([]).returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    setupAddGuild: ({
      existingConfig,
      homeDir,
      homePath,
      guildsPath,
      guildDirPath,
      questsDirPath,
    }: {
      existingConfig: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildsPath: FilePath;
      guildDirPath: FilePath;
      questsDirPath: FilePath;
    }): void => {
      configReadProxy.setupConfig({ config: existingConfig });
      homeEnsureProxy.setupEnsureSuccess({ homeDir, homePath, guildsPath });
      pathJoinProxy.returns({ result: guildDirPath });
      pathJoinProxy.returns({ result: questsDirPath });
      mkdirProxy.succeeds({ filepath: questsDirPath });
      configWriteProxy.setupSuccess();
    },

    // The caller-supplied-home scenario. It stages NOTHING on `dungeonmasterHomeFindBroker`,
    // `dungeonmasterHomeEnsureBroker` or `pathJoinAdapter`: every path the broker touches is
    // computed for real off the supplied home, so a test asserts genuine paths rather than staged
    // stand-ins, and code that fell back to the process-wide home would compute a DIFFERENT config
    // path and throw on an unmatched read. `fsMkdirAdapterProxy`'s own default succeeds for any
    // directory, which is what leaves `dirsCreated()` free to record the real answer.
    setupAddGuildInSuppliedHome: ({
      existingConfig,
      configFilePath,
    }: {
      existingConfig: GuildConfig;
      configFilePath: FilePath;
    }): void => {
      configReadProxy.setupConfigAt({ configFilePath, config: existingConfig });
      configWriteProxy.setupSuccessAt({ configFilePath });
    },

    setupDuplicatePath: ({ existingConfig }: { existingConfig: GuildConfig }): void => {
      configReadProxy.setupConfig({ config: existingConfig });
    },

    // Every directory the broker made, and every config file it wrote — in call order, addressed
    // by nothing. Containment is asserted against these two lists, never against what was staged.
    dirsCreated: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
    configFilesWritten: (): readonly unknown[] => configWriteProxy.configFilesWritten(),

    // Queues ONE further crypto.randomUUID call ahead of the sticky default above — a live
    // onceFor outranks it — so a test proving "no supplied id mints a fresh one each call" can
    // pin exactly which id each successive guildAddBroker call receives.
    stageGeneratedId: ({ id }: { id: string }): void => {
      randomUuidHandle.onceFor([]).returns(id);
    },
  };
};
