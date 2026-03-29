import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { GuildStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const orchestratorAddGuildAdapterProxy = (): {
  returns: (params: { guild: Guild }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.addGuild });

  mock.mockResolvedValue(GuildStub());

  return {
    returns: ({ guild }: { guild: Guild }): void => {
      mock.mockResolvedValueOnce(guild);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
