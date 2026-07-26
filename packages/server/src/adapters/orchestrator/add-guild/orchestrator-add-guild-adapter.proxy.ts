import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildStub } from '@dungeonmaster/shared/contracts';
import type { GuildName, GuildPath } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const orchestratorAddGuildAdapterProxy = (): {
  returns: (params: { name: GuildName; path: GuildPath; guild: Guild }) => void;
  throws: (params: { name: GuildName; path: GuildPath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.addGuild });

  return {
    returns: ({ name, path, guild }: { name: GuildName; path: GuildPath; guild: Guild }): void => {
      mock.calledWith([{ name, path }]).resolves(guild);
    },
    throws: ({ name, path, error }: { name: GuildName; path: GuildPath; error: Error }): void => {
      mock.calledWith([{ name, path }]).rejects(error);
    },
  };
};
