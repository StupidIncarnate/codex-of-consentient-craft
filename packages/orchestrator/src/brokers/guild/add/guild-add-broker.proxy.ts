import { randomUUID } from '#gateway/node/crypto';
import { dungeonmasterHomeEnsureBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/ensure/dungeonmaster-home-ensure-broker.proxy';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import type { Guild, GuildConfig } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { join } from '#gateway/node/path';

import { guildAddBroker } from './guild-add-broker';
import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';
import { guildConfigWriteBrokerProxy } from '../../guild-config/write/guild-config-write-broker.proxy';

registerModuleMock({ module: './guild-add-broker' });

type AddInput = Parameters<typeof guildAddBroker>[0];

const DEFAULT_GENERATED_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

export const guildAddBrokerProxy = (): {
  setupAddGuild: (params: {
    existingConfig: GuildConfig;
    homeDir: string;
    homePath: string;
    guildsPath: string;
    guildDirPath: string;
    questsDirPath: string;
  }) => void;
  setupAddGuildInSuppliedHome: (params: {
    existingConfig: GuildConfig;
    configFilePath: string;
  }) => void;
  setupDuplicatePath: (params: { existingConfig: GuildConfig }) => void;
  stageGeneratedId: (params: { id: string }) => void;
  // Runs the real broker for any object input with nothing else staged — a call that must fail on
  // its own input validation before it touches any I/O.
  setupRealBroker: () => void;
  // Answers one exact input with a caller-chosen guild, without running the real broker — which
  // mints its own id and createdAt. Any other input runs the real broker.
  setupResolves: (params: { input: AddInput; guild: Guild }) => void;
  // The whole argument object of every guildAddBroker call, whether it ran real or was answered.
  getCallInputs: () => readonly unknown[];
  dirsCreated: () => readonly unknown[];
  configFilesWritten: () => readonly unknown[];
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const configWriteProxy = guildConfigWriteBrokerProxy();
  const homeEnsureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const ensureDirHandle = ensureDirProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. `dungeonmasterHomeEnsureBrokerProxy`'s own constructor already
  // stages a real-passthrough default on this SAME shared handle, so a join() call this file never
  // addresses (the supplied-home guildsPath computation) still computes the genuine path.
  const joinHandle: MockHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const realMod = requireActual<{ guildAddBroker: typeof guildAddBroker }>({
    module: './guild-add-broker',
  });
  const addMock = registerMock({ fn: guildAddBroker });
  // The scenario setups below run the real broker for any object input; an exact `setupResolves`
  // address outranks it.
  const isAddInput = (input: unknown): boolean => typeof input === 'object' && input !== null;
  const runRealBroker = (): void => {
    addMock.calledWith([isAddInput]).implement(realMod.guildAddBroker as never);
  };

  // randomUUID and Date.prototype.toISOString take no identifying argument — [] is
  // the honest address for both.
  const randomUuidHandle = registerMock({ fn: randomUUID });
  randomUuidHandle.calledWith([]).returns(DEFAULT_GENERATED_ID);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    setupRealBroker: (): void => {
      runRealBroker();
    },
    setupResolves: ({ input, guild }: { input: AddInput; guild: Guild }): void => {
      addMock.calledWith([input]).resolves(guild);
    },
    getCallInputs: (): readonly unknown[] => addMock.callsMatching([]).map((call) => call[0]),

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
      homePath: string;
      guildsPath: string;
      guildDirPath: string;
      questsDirPath: string;
    }): void => {
      runRealBroker();
      configReadProxy.setupConfig({ config: existingConfig });
      homeEnsureProxy.setupEnsureSuccess({ homeDir, homePath, guildsPath });

      // The id segment is whatever this test staged for randomUUID (the sticky default
      // above, or a one-shot from stageGeneratedId) — read back off the caller's own
      // guildDirPath/guildsPath rather than guessed, so the join address matches the real call
      // whichever id is in play.
      const guildId = guildDirPath.slice(guildsPath.length + 1);
      joinHandle.calledWith([guildsPath, guildId]).returns(guildDirPath);
      joinHandle
        .calledWith([guildDirPath, dungeonmasterHomeStatics.paths.questsDir])
        .returns(questsDirPath);
      ensureDirHandle.succeeds({ path: questsDirPath });
      configWriteProxy.setupSuccess();
    },

    // The caller-supplied-home scenario. It stages NOTHING on `dungeonmasterHomeFindBroker`,
    // `dungeonmasterHomeEnsureBroker` or `join`: every path the broker touches is computed for real
    // off the supplied home, so a test asserts genuine paths rather than staged stand-ins, and code
    // that fell back to the process-wide home would compute a DIFFERENT config path and throw on an
    // unmatched read. `ensureDirProxy` offers no real-passthrough default of its own (unlike
    // `join`'s, inherited from `dungeonmasterHomeEnsureBrokerProxy` above), so this computes the
    // SAME real path with the real Node `path.join` and stages exactly that.
    setupAddGuildInSuppliedHome: ({
      existingConfig,
      configFilePath,
    }: {
      existingConfig: GuildConfig;
      configFilePath: string;
    }): void => {
      runRealBroker();
      configReadProxy.setupConfigAt({ configFilePath, config: existingConfig });
      configWriteProxy.setupSuccessAt({ configFilePath });

      const home = configFilePath.replace(
        `/${dungeonmasterHomeStatics.paths.configFile}`,
        '',
      );
      const questsDir = realPath.join(
        home,
        dungeonmasterHomeStatics.paths.guildsDir,
        DEFAULT_GENERATED_ID,
        dungeonmasterHomeStatics.paths.questsDir,
      );
      ensureDirHandle.succeeds({ path: questsDir });
    },

    setupDuplicatePath: ({ existingConfig }: { existingConfig: GuildConfig }): void => {
      runRealBroker();
      configReadProxy.setupConfig({ config: existingConfig });
    },

    // Every directory the broker made, and every config file it wrote — in call order, addressed
    // by nothing. Containment is asserted against these two lists, never against what was staged.
    dirsCreated: (): readonly unknown[] =>
      ensureDirHandle.getCallsFor({ path: () => true }).map((call) => call[0]),
    configFilesWritten: (): readonly unknown[] => configWriteProxy.configFilesWritten(),

    // Queues ONE further randomUUID call ahead of the sticky default above — a live
    // onceFor outranks it — so a test proving "no supplied id mints a fresh one each call" can
    // pin exactly which id each successive guildAddBroker call receives.
    stageGeneratedId: ({ id }: { id: string }): void => {
      randomUuidHandle.onceFor([]).returns(id);
    },
  };
};
