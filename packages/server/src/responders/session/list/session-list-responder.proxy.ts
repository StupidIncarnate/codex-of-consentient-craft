import { sessionListBrokerProxy } from '../../../brokers/session/list/session-list-broker.proxy';
import { sessionSummaryCacheStateProxy } from '../../../state/session-summary-cache/session-summary-cache-state.proxy';
import { SessionListResponder } from './session-list-responder';
import type { GuildId, GuildStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const SessionListResponderProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupHomeDir: (params: { path: string }) => void;
  setupGlobFiles: (params: { files: string[] }) => void;
  setupFileStat: (params: { birthtime: Date; mtimeMs: number }) => void;
  setupFileContent: (params: { content: string }) => void;
  setupQuests: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  setupGuildError: () => void;
  setupGuildNotFound: (params: { guildId: GuildId }) => void;
  callResponder: typeof SessionListResponder;
} => {
  const brokerProxy = sessionListBrokerProxy();
  sessionSummaryCacheStateProxy();

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      brokerProxy.setupGuild({ guild });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      brokerProxy.setupHomeDir({ path });
    },
    setupGlobFiles: ({ files }: { files: string[] }): void => {
      brokerProxy.setupGlobFiles({ files });
    },
    setupFileStat: ({ birthtime, mtimeMs }: { birthtime: Date; mtimeMs: number }): void => {
      brokerProxy.setupFileStat({ birthtime, mtimeMs });
    },
    setupFileContent: ({ content }: { content: string }): void => {
      brokerProxy.setupFileContent({ content });
    },
    setupQuests: ({ guildId, quests }: { guildId: GuildId; quests: QuestListItem[] }): void => {
      brokerProxy.setupQuests({ guildId, quests });
    },
    setupGuildError: (): void => {
      brokerProxy.setupGuild({ guild: {} as never });
    },
    setupGuildNotFound: ({ guildId }: { guildId: GuildId }): void => {
      brokerProxy.setupGuildNotFound({ guildId });
    },
    callResponder: SessionListResponder,
  };
};
