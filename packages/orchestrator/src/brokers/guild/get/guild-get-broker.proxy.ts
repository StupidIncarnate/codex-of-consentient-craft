import type { GuildConfig, GuildStub } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';
import { guildConfigWriteBrokerProxy } from '../../guild-config/write/guild-config-write-broker.proxy';
import { guildGetBroker } from './guild-get-broker';

type Guild = ReturnType<typeof GuildStub>;

export const guildGetBrokerProxy = (): {
  setupConfig: (params: { config: GuildConfig }) => void;
  setupDirectGuild: (params: { guild: Guild }) => void;
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const configWriteProxy = guildConfigWriteBrokerProxy();

  // registerMock wraps the live export directly — unlike registerModuleMock, it needs no
  // AST-hoisted jest.mock() to take effect, so this proxy composes safely from a caller in
  // another PACKAGE too, whose own jest transform never sees this file's module-scope code.
  const mocked = registerMock({ fn: guildGetBroker });
  // Default: passthrough so existing consumers driving the fs chain keep working. `guildId`
  // varies per call and the real implementation handles any guildId correctly using the args
  // it actually receives, so `[]` is the honest prefix-match address for this generic fallback.
  const realMod = requireActual<{ guildGetBroker: typeof guildGetBroker }>({
    module: './guild-get-broker',
  });
  mocked.calledWith([]).implement(realMod.guildGetBroker as never);

  return {
    setupConfig: ({ config }: { config: GuildConfig }): void => {
      configReadProxy.setupConfig({ config });
      // guildGetBroker only calls guildConfigWriteBroker when the matched guild lacks a
      // urlSlug (the backfill branch). Staging the write mocks unconditionally leaves two
      // never-consumed entries sitting in path.join's shared call-order queue whenever every
      // guild already carries a urlSlug — the common case. A later, unrelated real path.join
      // call (e.g. questFindQuestPathBroker resolving a completely different quest lookup,
      // composed into the same test alongside this proxy) then steals those stale values
      // instead of its own. Only stage the write path when this config can actually reach it.
      if (config.guilds.some((guild) => !guild.urlSlug)) {
        configWriteProxy.setupSuccess();
      }
    },
    setupDirectGuild: ({ guild }: { guild: Guild }): void => {
      mocked.onceFor([]).resolves(guild);
    },
  };
};
