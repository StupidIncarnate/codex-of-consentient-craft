import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { GuildAddResponder } from './guild-add-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildAddResponderProxy = (): {
  setupAddGuild: (params: { name: string; path: string; guild: Guild }) => void;
  setupAddGuildError: (params: {
    name: string;
    path: string;
    error?: Error;
    message?: string;
  }) => void;
  getAddGuildCalls: () => RecordedCalls;
  callResponder: typeof GuildAddResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupAddGuild: ({ name, path, guild }: { name: string; path: string; guild: Guild }): void => {
      orchestrator.addGuildReturns({ name, path, guild });
    },
    setupAddGuildError: ({
      name,
      path,
      error,
      message,
    }: {
      name: string;
      path: string;
      error?: Error;
      message?: string;
    }): void => {
      orchestrator.addGuildThrows({
        name,
        path,
        error: error ?? NativeErrorStub({ message: message ?? 'Failed to add guild' }),
      });
    },
    getAddGuildCalls: (): RecordedCalls => orchestrator.addGuildGetCalls(),
    callResponder: GuildAddResponder,
  };
};
