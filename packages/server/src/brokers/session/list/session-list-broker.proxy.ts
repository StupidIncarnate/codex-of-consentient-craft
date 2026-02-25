import type { GuildStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import type { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

type Guild = ReturnType<typeof GuildStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type GlobPattern = ReturnType<typeof GlobPatternStub>;
type FilePath = ReturnType<typeof FilePathStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const sessionListBrokerProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupHomeDir: (params: { path: string }) => void;
  setupGlobFiles: (params: { files: string[] }) => void;
  setupFileStat: (params: { birthtime: Date; mtimeMs: number }) => void;
  setupFileContent: (params: { content: string }) => void;
  setupFileContentError: (params: { error: Error }) => void;
  setupFileStatError: (params: { error: Error }) => void;
  setupQuests: (params: { quests: QuestListItem[] }) => void;
} => {
  const guildProxy = orchestratorGetGuildAdapterProxy();
  const questsProxy = orchestratorListQuestsAdapterProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const globProxy = globFindAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      guildProxy.returns({ guild });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
    },
    setupGlobFiles: ({ files }: { files: string[] }): void => {
      globProxy.returns({
        pattern: '*.jsonl' as GlobPattern,
        files: files.map((f) => f as FilePath),
      });
    },
    setupFileStat: ({ birthtime, mtimeMs }: { birthtime: Date; mtimeMs: number }): void => {
      statProxy.returns({ stats: { birthtime, mtimeMs } });
    },
    setupFileContent: ({ content }: { content: string }): void => {
      readFileProxy.returns({
        filepath: '' as FilePath,
        contents: content as FileContents,
      });
    },
    setupFileContentError: ({ error }: { error: Error }): void => {
      readFileProxy.throws({
        filepath: '' as FilePath,
        error,
      });
    },
    setupFileStatError: ({ error }: { error: Error }): void => {
      statProxy.throws({ error });
    },
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      questsProxy.returns({ quests });
    },
  };
};
