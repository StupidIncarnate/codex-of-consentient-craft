import { sessionContract } from '@dungeonmaster/shared/contracts';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { homedir } from '#gateway/node/os';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { statProxy } from '#gateway/node/fs__promises/stat/stat.proxy';
import { globProxy } from '#gateway/npm/glob/glob/glob.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { globIgnoreStatics } from '../../../statics/glob-ignore/glob-ignore-statics';

type Guild = ReturnType<typeof GuildStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type FilePath = string;

export const sessionListBrokerProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupHomeDir: (params: { path: string }) => void;
  setupGlobFiles: (params: { files: string[]; pattern?: string }) => void;
  setupFileStat: (params: { birthtime: Date; mtimeMs: number }) => void;
  setupFileContent: (params: { content: string }) => void;
  setupFileContentError: (params: { error: Error }) => void;
  setupFileStatError: (params: { error: Error }) => void;
  setupQuests: (params: { guildId: Guild['id']; quests: QuestListItem[] }) => void;
  setupLoadQuest: (params: { quest: Quest }) => void;
  setupLoadQuestError: (params: { questId: Quest['id']; error: Error }) => void;
  setupGuildNotFound: (params: { guildId: Guild['id'] }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();
  const homedirHandle = registerMock({ fn: homedir });
  const globHandle = globProxy();
  const statChildProxy = statProxy();
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
  const staged: { homeDir: string | undefined; guildPath: string | undefined } = {
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
      sessionId: sessionContract.shape.id.parse('_probe'),
    });
    return probePath.slice(0, probePath.lastIndexOf('/'));
  };

  const crossProjectRootFor = (): FilePath => {
    if (staged.homeDir === undefined) {
      throw new Error('sessionListBrokerProxy: setupGlobFiles needs setupHomeDir staged first');
    }
    return `${staged.homeDir}/.claude/projects`;
  };

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      staged.guildPath = guild.path;
      orchestrator.getGuildReturns({ guild });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      staged.homeDir = path;
      homedirHandle.calledWith([]).returns(path);
    },
    setupGlobFiles: ({ files, pattern }: { files: string[]; pattern?: string }): void => {
      const filePaths = files.map((f) => f);
      // No explicit pattern => the broker's direct scan (default '*.jsonl', encoded-project cwd);
      // an explicit pattern => the cross-project scan (`*/<sessionId>.jsonl`, flat-root cwd) — the
      // same split the broker's own two glob call sites use.
      const cwd = pattern === undefined ? directProjectDirFor() : crossProjectRootFor();
      globHandle.returns({
        pattern: pattern ?? '*.jsonl',
        options: { cwd, nodir: false, ignore: globIgnoreStatics.defaults },
        matches: [...filePaths],
      });
      pendingStatFilePaths.push(...filePaths);
      pendingReadFilePaths.push(...filePaths);
    },
    setupFileStat: ({ birthtime, mtimeMs }: { birthtime: Date; mtimeMs: number }): void => {
      const filePath = pendingStatFilePaths.shift() ?? ('' as FilePath);
      statChildProxy.returnsFile({
        path: filePath,
        sizeBytes: 0,
        modifiedAtMs: mtimeMs,
        createdAtMs: birthtime.getTime(),
      });
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
      // statProxy has no generic "throws any error" method — throwsMatchingPath demands an FsError
      // (a coded, recorded failure), stamped from the caller-supplied Error's own message, the same
      // conversion setupFileContentError does above for readFileProxy.
      statChildProxy.throwsMatchingPath({
        path: filePath,
        error: Object.assign(error, { code: error.message.split(':')[0] ?? 'UNKNOWN' }),
      });
    },
    setupQuests: ({ guildId, quests }: { guildId: Guild['id']; quests: QuestListItem[] }): void => {
      orchestrator.listQuestsReturns({ guildId, quests });
      // The broker calls loadQuest for EVERY listed quest with `.catch(() => null)` chained on the
      // call, so an unstaged loadQuest would throw before that `.catch` attaches. Each listed quest
      // starts as a rejected load (a real rejected promise the `.catch` handles); setupLoadQuest /
      // setupLoadQuestError, called after this, address the same questId and win.
      for (const quest of quests) {
        orchestrator.loadQuestThrows({
          questId: quest.id,
          error: NativeErrorStub({
            message: `sessionListBrokerProxy: no loadQuest scenario staged for ${quest.id}`,
          }),
        });
      }
    },
    setupLoadQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupLoadQuestError: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
    },
    setupGuildNotFound: ({ guildId }: { guildId: Guild['id'] }): void => {
      orchestrator.getGuildThrows({
        guildId,
        error: NativeErrorStub({ message: `Guild not found: ${guildId}` }),
      });
    },
  };
};
