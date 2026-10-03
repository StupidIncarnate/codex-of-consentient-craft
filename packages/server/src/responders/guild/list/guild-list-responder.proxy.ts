import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { GuildListResponder } from './guild-list-responder';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const GuildListResponderProxy = (): {
  setupListGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupListGuildsError: (params: { message: string }) => void;
  callResponder: typeof GuildListResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupListGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      orchestrator.listGuildsReturns({ guilds });
    },
    setupListGuildsError: ({ message }: { message: string }): void => {
      orchestrator.listGuildsThrows({ error: NativeErrorStub({ message }) });
    },
    callResponder: GuildListResponder,
  };
};
