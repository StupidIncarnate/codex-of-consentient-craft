import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { GuildStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const guildWriteRouteBrokerProxy = (): {
  succeeds: ({ name, path, guild }: { name: string; path: string; guild: Guild }) => void;
} => {
  // fsMkdirAdapterProxy's own default (any unaddressed call succeeds) is all this route needs —
  // composed bare, with no per-call staging, exactly as chat-subagent-tail-broker.proxy.ts does.
  fsMkdirAdapterProxy();
  const addGuildHandle = registerMock({ fn: StartOrchestrator.addGuild });

  return {
    succeeds: ({ name, path, guild }: { name: string; path: string; guild: Guild }): void => {
      addGuildHandle.calledWith([{ name, path }]).resolves(guild);
    },
  };
};
