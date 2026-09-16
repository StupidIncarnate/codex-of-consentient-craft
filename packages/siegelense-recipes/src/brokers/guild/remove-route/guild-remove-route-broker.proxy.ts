import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const guildRemoveRouteBrokerProxy = (): {
  succeeds: ({ guildId }: { guildId: string }) => void;
} => {
  const removeGuildHandle = registerMock({ fn: StartOrchestrator.removeGuild });

  return {
    succeeds: ({ guildId }: { guildId: string }): void => {
      removeGuildHandle.calledWith([{ guildId }]).resolves({ success: true });
    },
  };
};
