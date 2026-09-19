import { guildAddBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildAddBrokerProxy } from '@dungeonmaster/orchestrator/testing';
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
  // guildAddBrokerProxy's own setup mints a FIXED id/createdAt via crypto.randomUUID, which does
  // not let a test stage an arbitrary `guild` fixture — created here only to satisfy
  // `enforce-proxy-child-creation`; this route's own registerMock below stages the real answer.
  guildAddBrokerProxy();
  const addGuildHandle = registerMock({ fn: guildAddBroker });

  return {
    succeeds: ({ name, path, guild }: { name: string; path: string; guild: Guild }): void => {
      addGuildHandle.calledWith([{ name, path }]).resolves(guild);
    },
  };
};
