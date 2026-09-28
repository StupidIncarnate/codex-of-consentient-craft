import { absoluteFilePathContract, sessionIdContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  GuildId,
  GuildStub,
  QuestId,
  QuestListItemStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { homedir } from '#gateway/node/os';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import type { GlobPatternStub } from '@dungeonmaster/shared/contracts';
import type { FilePathStub } from '../../../contracts/file-path/file-path.stub';

type Guild = ReturnType<typeof GuildStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type GlobPattern = ReturnType<typeof GlobPatternStub>;
type FilePath = ReturnType<typeof FilePathStub>;

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
  const readProxy = readFileProxy();

  // sessionListBroker reads each globbed file's contents (and stats it first) in the same order
  // the glob results were produced (dedupedFiles.map). Tracking the real paths here — instead of
  // a dummy key — lets setupFileStat/setupFileContent (and their error variants) address the
  // specific disk file a test means, rather than relying on call-order luck to pair the right
  // stat/content with the right path. Stat and readFile each get their own queue because a test
  // may stat a file without ever reading its content (cache hit) or vice versa.
  const pendingStatFilePaths: FilePath[] = [];
  const pendingReadFilePaths: FilePath[] = [];

  // The broker computes two distinct glob cwds from the SAME homeDir + guild.path this proxy is
  // staged with: the direct scan's cwd is the encoded Claude project dir (mirroring
  // claudeProjectPathEncoderTransformer, exactly as the broker itself derives it), and the
  // cross-project scan's cwd is the flat `.claude/projects` root. Recomputing them here — instead
  // of accepting a caller-given cwd — is what makes a broker that computes the WRONG cwd (a
  // mutated homedir, a bad encoding) call glob with an address nothing here answers.
  const staged: { homeDir: AbsoluteFilePath | undefined; guildPath: AbsoluteFilePath | undefined } =
    {
      homeDir: undefined,
      guildPath: undefined,
    };

  const directProjectDirFor = (): FilePath => {
    if (staged.homeDir === undefined || staged.guildPath === undefined) {
      throw new Error(
        'sessionListBrokerProxy: setupGlobFiles needs setupHomeDir and setupGuild staged first',
      );
    }
    const probePath = claudeProjectPathEncoderTransformer({
      homeDir: staged.homeDir,
      projectPath: staged.guildPath,
      sessionId: sessionIdContract.parse('_probe'),
    });
    return String(probePath).slice(0, String(probePath).lastIndexOf('/')) as FilePath;
  };

  const crossProjectRootFor = (): FilePath => {
    if (staged.homeDir === undefined) {
      throw new Error('sessionListBrokerProxy: setupGlobFiles needs setupHomeDir staged first');
    }
    return `${staged.homeDir}/.claude/projects` as FilePath;
  };

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      staged.guildPath = absoluteFilePathContract.parse(guild.path);
      orchestrator.getGuildReturns({ guild });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      staged.homeDir = absoluteFilePathContract.parse(path);
      homedirHandle.calledWith([]).returns(path);
    },
    setupGlobFiles: ({ files, pattern }: { files: string[]; pattern?: string }): void => {
      const filePaths = files.map((f) => f as FilePath);
      // No explicit pattern => the broker's direct scan (default '*.jsonl', encoded-project cwd);
      // an explicit pattern => the cross-project scan (`*/<sessionId>.jsonl`, flat-root cwd) — the
      // same split the broker's own two glob call sites use.
      const cwd = pattern === undefined ? directProjectDirFor() : crossProjectRootFor();
      globProxy.returns({
        pattern: (pattern ?? '*.jsonl') as GlobPattern,
        cwd,
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
      readProxy.returns({
        path: filepath,
        contents: content,
      });
    },
    setupFileContentError: ({ error }: { error: Error }): void => {
      const filepath = pendingReadFilePaths.shift() ?? ('' as FilePath);
      // readFileProxy's throwsMatchingPath demands an FsError (a coded, recorded failure — G19
      // bans a catch-all Error), stamped from the caller-supplied Error's own message, per this
      // codebase's `'<CODE>: <detail>'` convention.
      readProxy.throwsMatchingPath({
        path: filepath,
        error: Object.assign(error, { code: error.message.split(':')[0] ?? 'UNKNOWN' }),
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
