import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { questFindBrokerProxy } from '../find/quest-find-broker.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;
type FilePath = string;

// Mirrors the private constants quest-find-broker.proxy.ts stages the search around — this proxy
// has to predict the exact absolute path the REAL find broker will hand back so the fs mock can be
// addressed by it. Always staged under the 'repoLocal' root since which root wins is already covered
// by quest-find-broker's own tests.
const REPO_CWD = '/repo';
const DUNGEONMASTER_DIR = '.dungeonmaster';
const GUILDS_DIR = 'guilds';
const QUESTS_DIR = 'quests';
const QUEST_FILE = 'quest.json';
const GUILD_ID = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

export const questLoadBrokerProxy = (): {
  setupQuest: (params: { questId: QuestId; questJson: unknown }) => void;
  setupQuestRawContent: (params: { questId: QuestId; content: string }) => void;
  setupMissingQuest: () => void;
} => {
  const findProxy = questFindBrokerProxy();
  const readFileProxy = readFileSyncProxy();

  const pathFor = ({ questId }: { questId: QuestId }): FilePath =>
    `${REPO_CWD}/${DUNGEONMASTER_DIR}/${GUILDS_DIR}/${GUILD_ID}/${QUESTS_DIR}/${questId}/${QUEST_FILE}`;

  return {
    setupQuest: ({ questId, questJson }: { questId: QuestId; questJson: unknown }): void => {
      findProxy.setupQuestAt({ root: 'repoLocal', guildId: GUILD_ID, questId });
      readFileProxy.returns({
        path: pathFor({ questId }),
        contents: JSON.stringify(questJson),
      });
    },
    setupQuestRawContent: ({ questId, content }: { questId: QuestId; content: string }): void => {
      findProxy.setupQuestAt({ root: 'repoLocal', guildId: GUILD_ID, questId });
      readFileProxy.returns({
        path: pathFor({ questId }),
        contents: content,
      });
    },
    setupMissingQuest: (): void => {
      findProxy.setupNoQuestAnywhere();
    },
  };
};
