import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildId, GuildStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const orchestratorUpdateGuildAdapterProxy = (): {
  returns: (params: { guildId: GuildId; guild: Guild }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.updateGuild });

  return {
    returns: ({ guildId, guild }: { guildId: GuildId; guild: Guild }): void => {
      mock.calledWith([{ guildId }]).resolves(guild);
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
  };
};
