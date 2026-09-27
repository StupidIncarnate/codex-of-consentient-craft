import type {
  GuildId,
  GuildStub,
  QuestId,
  QuestListItemStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { homedir } from '#gateway/node/os';
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
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
  const orchestrator = StartOrchestratorProxy();
  // Second handle on the SAME mocked StartOrchestrator.loadQuest function — shares staged calls
  // with the handle StartOrchestratorProxy already registered (jestRegisterMockAdapter keys its
  // state by the mock function itself, the same pattern quest-chat-responder.proxy.ts uses for
  // startChatHandle). This broker calls loadQuest directly (no wrapping async adapter, since A02
  // deleted it) with `.catch(() => null)` chained on the call itself for EVERY quest whether or not
  // a test cares about its workItems — an unstaged call throws SYNCHRONOUSLY (registerMock has no
  // passthrough), which lands before that `.catch()` can attach and propagates out of the broker
  // entirely instead of degrading to null. `.rejects(...)` (not `.throws(...)`) is what makes this
  // a REAL rejected promise the `.catch()` can actually catch — restoring the pre-A02 adapter's own
  // async-wrapping safety net for every quest a test's own setupLoadQuest/setupLoadQuestError never
  // addresses.
  registerMock({ fn: StartOrchestrator.loadQuest })
    .calledWith([])
    .rejects(new Error('sessionListBrokerProxy: no loadQuest scenario staged for this questId'));
  const homedirHandle = registerMock({ fn: homedir });
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
      orchestrator.getGuildReturns({ guild });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirHandle.calledWith([]).returns(path);
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
      orchestrator.listQuestsReturns({ guildId, quests });
    },
    setupLoadQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupLoadQuestError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
    },
    setupGuildNotFound: ({ guildId }: { guildId: GuildId }): void => {
      orchestrator.getGuildThrows({ guildId, error: new Error(`Guild not found: ${guildId}`) });
    },
  };
};
