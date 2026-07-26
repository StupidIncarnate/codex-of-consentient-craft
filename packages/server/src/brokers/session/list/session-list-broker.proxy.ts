import type {
  GuildId,
  GuildStub,
  QuestId,
  QuestListItemStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { GlobPatternStub } from '@dungeonmaster/shared/contracts';
import type { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FileContentsStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type GlobPattern = ReturnType<typeof GlobPatternStub>;
type FilePath = ReturnType<typeof FilePathStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const sessionListBrokerProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupHomeDir: (params: { path: string }) => void;
  setupGlobFiles: (params: { files: string[]; pattern?: string }) => void;
  setupFileStat: (params: { birthtime: Date; mtimeMs: number }) => void;
  setupFileContent: (params: { content: string }) => void;
  setupFileContentError: (params: { error: Error }) => void;
  setupFileStatError: (params: { error: Error }) => void;
  setupQuests: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  setupLoadQuest: (params: { quest: Quest }) => void;
  setupLoadQuestError: (params: { questId: QuestId; error: Error }) => void;
  setupGuildNotFound: (params: { guildId: GuildId }) => void;
} => {
  const guildProxy = orchestratorGetGuildAdapterProxy();
  const questsProxy = orchestratorListQuestsAdapterProxy();
  const loadQuestProxy = orchestratorLoadQuestAdapterProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const globProxy = globFindAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  // sessionListBroker reads each globbed file's contents (and stats it first) in the same order
  // the glob results were produced (dedupedFiles.map). Tracking the real paths here — instead of
  // a dummy key — lets setupFileStat/setupFileContent (and their error variants) address the
  // specific disk file a test means, rather than relying on call-order luck to pair the right
  // stat/content with the right path. Stat and readFile each get their own queue because a test
  // may stat a file without ever reading its content (cache hit) or vice versa.
  const pendingStatFilePaths: FilePath[] = [];
  const pendingReadFilePaths: FilePath[] = [];

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      guildProxy.returns({ guild });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
    },
    setupGlobFiles: ({ files, pattern }: { files: string[]; pattern?: string }): void => {
      const filePaths = files.map((f) => f as FilePath);
      globProxy.returns({
        pattern: (pattern ?? '*.jsonl') as GlobPattern,
        files: filePaths,
      });
      pendingStatFilePaths.push(...filePaths);
      pendingReadFilePaths.push(...filePaths);
    },
    setupFileStat: ({ birthtime, mtimeMs }: { birthtime: Date; mtimeMs: number }): void => {
      const filePath = pendingStatFilePaths.shift() ?? ('' as FilePath);
      statProxy.returns({ filePath, stats: { birthtime, mtimeMs } });
    },
    setupFileContent: ({ content }: { content: string }): void => {
      const filepath = pendingReadFilePaths.shift() ?? ('' as FilePath);
      readFileProxy.returns({
        filepath,
        contents: content as FileContents,
      });
    },
    setupFileContentError: ({ error }: { error: Error }): void => {
      const filepath = pendingReadFilePaths.shift() ?? ('' as FilePath);
      readFileProxy.throws({
        filepath,
        error,
      });
    },
    setupFileStatError: ({ error }: { error: Error }): void => {
      const filePath = pendingStatFilePaths.shift() ?? ('' as FilePath);
      statProxy.throws({ filePath, error });
    },
    setupQuests: ({ guildId, quests }: { guildId: GuildId; quests: QuestListItem[] }): void => {
      questsProxy.returns({ guildId, quests });
    },
    setupLoadQuest: ({ quest }: { quest: Quest }): void => {
      loadQuestProxy.returns({ questId: quest.id, quest });
    },
    setupLoadQuestError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      loadQuestProxy.throws({ questId, error });
    },
    setupGuildNotFound: ({ guildId }: { guildId: GuildId }): void => {
      guildProxy.throws({ guildId, error: new Error(`Guild not found: ${guildId}`) });
    },
  };
};
