import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildStub } from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const orchestratorGetGuildAdapterProxy = (): {
  // The guild's own id IS the address of a "get guild by id" call — deriving it from
  // guild.id (rather than taking a separate guildId param) keeps every caller honest: the
  // guild returned always matches the id that was asked for.
  returns: (params: { guild: Guild }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getGuild });

  return {
    returns: ({ guild }: { guild: Guild }): void => {
      mock.calledWith([{ guildId: guild.id }]).resolves(guild);
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
  };
};
