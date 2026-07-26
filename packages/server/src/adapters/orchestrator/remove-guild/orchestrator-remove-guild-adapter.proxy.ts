import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildId } from '@dungeonmaster/shared/contracts';

// orchestratorRemoveGuildAdapter discards StartOrchestrator.removeGuild's resolved value and
// always returns {success: true} itself, so no caller has ever needed to describe a success
// value here — only the throw path is observable. calledWith([]) defaults every call to a quiet
// success; the error test overrides it with a later, guildId-specific staging.
export const orchestratorRemoveGuildAdapterProxy = (): {
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.removeGuild });

  mock.calledWith([]).resolves(undefined);

  return {
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
  };
};
