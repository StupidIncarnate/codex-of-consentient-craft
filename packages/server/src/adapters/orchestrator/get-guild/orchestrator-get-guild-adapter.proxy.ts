jest.mock('@dungeonmaster/orchestrator');

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { GuildStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const orchestratorGetGuildAdapterProxy = (): {
  returns: (params: { guild: Guild }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.getGuild);

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
