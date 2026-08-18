/**
 * PURPOSE: Proxy for quest-get-blight-checklist-broker that mocks quest find/load, the quest's
 * cwd resolution (worktree / repo-root / missing-worktree), and every git reading — the `quest` /
 * `commit` scopes' single diff (`setupDiff`), the `working-tree` scope's tracked+untracked union
 * (`setupWorkingTreeDiff`), and the `unpushed` scope's upstream lookup (`setupUpstream` /
 * `setupNoUpstream`)
 *
 * USAGE:
 * const proxy = questGetBlightChecklistBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });
 * proxy.setupQuestNotFound();
 */

import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  ExitCodeStub,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  RepoRootCwdStub,
} from '@dungeonmaster/shared/contracts';
import type { ErrorMessage, ExitCode, QuestStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { gitDiffFilesAdapterProxy } from '../../../adapters/git/diff-files/git-diff-files-adapter.proxy';
import { gitUpstreamShaAdapterProxy } from '../../../adapters/git/upstream-sha/git-upstream-sha-adapter.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { gitWorkingTreeFilesBrokerProxy } from '../../git/working-tree-files/git-working-tree-files-broker.proxy';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

// The checklist's cwd resolution is mocked at the module boundary — questCwdResolveBroker's own
// worktree / repo-root / missing-worktree branching has its own test suite; here it only supplies
// the resolved cwd (or the missing path) per quest.
registerModuleMock({ module: '../cwd-resolve/quest-cwd-resolve-broker' });

type Quest = ReturnType<typeof QuestStub>;

const DEFAULT_REPO_ROOT = RepoRootCwdStub({ value: '/home/testuser/my-guild' });

// `scope: 'unpushed'` spawns bare `git` TWICE — `rev-parse @{upstream}` for the range base, then
// the diff over it — and the shared childProcessSpawnCaptureAdapterProxy addresses on COMMAND
// alone, staging one sticky answer per command. Staging both there collapses into whichever was
// registered last, so the upstream half is addressed on its full args instead, exactly as
// gitWorkingTreeFilesBrokerProxy discriminates its own two `git` readings. The more specific
// address wins, so `setupDiff`'s command-level answer still serves the diff call.
const UPSTREAM_ARGS = ['rev-parse', '@{upstream}'];

const createGitChild = ({
  stdout,
  exitCode,
}: {
  stdout: ErrorMessage;
  exitCode: ExitCode;
}): ChildProcess => {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.stderr = new Readable({
    read(): void {
      /* noop */
    },
  });

  const mockStdout = child.stdout;
  const mockStderr = child.stderr;

  setImmediate(() => {
    if (String(stdout).length > 0) {
      mockStdout.push(Buffer.from(String(stdout)));
    }
    mockStdout.push(null);
    mockStderr.push(null);
    child.emit('exit', Number(exitCode), null);
  });

  return child;
};

export const questGetBlightChecklistBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupDiff: (params: { files: readonly string[] }) => void;
  setupWorkingTreeDiff: (params: {
    trackedFiles: readonly string[];
    untrackedFiles: readonly string[];
  }) => void;
  setupWorktree: (params: { quest: Quest; worktreePath: string }) => void;
  setupWorktreeMissing: (params: { quest: Quest; worktreePath: string }) => void;
  setupUpstream: (params: { sha: string }) => void;
  setupNoUpstream: () => void;
  wasUpstreamAsked: () => boolean;
  getGitDiffArgs: () => unknown;
  getGitDiffCwd: () => unknown;
  getGitArgsList: () => readonly unknown[];
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so this child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();
  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  const gitDiffProxy = gitDiffFilesAdapterProxy();
  const workingTreeProxy = gitWorkingTreeFilesBrokerProxy();
  // Created but unstaged, same reason gitWorkingTreeFilesBrokerProxy creates its two adapter
  // proxies: this proxy answers `spawn` directly for the upstream read, so the adapter proxy's own
  // command-addressed staging is never exercised.
  gitUpstreamShaAdapterProxy();
  const spawnHandle = registerMock({ fn: spawn });

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      pathJoinProxy.returns({ result: questFilePath });
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Sensible default: the repo-root resolution, matching the shape every QuestStub (no
      // worktreePath) takes — so the worktree-vs-repo-root distinction stays transparent to
      // every test that isn't specifically about it. setupWorktree / setupWorktreeMissing below
      // override this default for exactly one call via `onceFor`.
      cwdMock
        .calledWith([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'repo-root', cwd: DEFAULT_REPO_ROOT }));
    },

    setupQuestNotFound: (): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },

    setupDiff: ({ files }: { files: readonly string[] }): void => {
      gitDiffProxy.setupDiffOutput({ output: files.join('\n') });
    },

    // The `working-tree` scope reads git TWICE — a rangeless diff for tracked modifications and an
    // ls-files for the untracked additions — so the two answers are staged separately here rather
    // than through setupDiff's single command-addressed answer, which cannot tell them apart.
    setupWorkingTreeDiff: ({
      trackedFiles,
      untrackedFiles,
    }: {
      trackedFiles: readonly string[];
      untrackedFiles: readonly string[];
    }): void => {
      workingTreeProxy.setupWorkingTree({ trackedFiles, untrackedFiles });
    },

    setupWorktree: ({ quest, worktreePath }: { quest: Quest; worktreePath: string }): void => {
      cwdMock.onceFor([{ questId: quest.id }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: worktreePath }),
        }),
      );
    },

    setupWorktreeMissing: ({
      quest,
      worktreePath,
    }: {
      quest: Quest;
      worktreePath: string;
    }): void => {
      cwdMock.onceFor([{ questId: quest.id }]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath: AbsoluteFilePathStub({ value: worktreePath }),
        }),
      );
    },

    // What `git rev-parse @{upstream}` answers in the quest's checkout — the base
    // `scope: 'unpushed'` measures its round from.
    setupUpstream: ({ sha }: { sha: string }): void => {
      spawnHandle.calledWith(['git', UPSTREAM_ARGS]).implement(() =>
        createGitChild({
          stdout: ErrorMessageStub({ value: `${sha}\n` }),
          exitCode: ExitCodeStub({ value: 0 }),
        }),
      );
    },

    // A branch tracking nothing. Real state, not an error: it is what a quest carved before
    // riftcarver started pushing looks like, and it is what sends the scope to its baseRef fallback.
    setupNoUpstream: (): void => {
      spawnHandle.calledWith(['git', UPSTREAM_ARGS]).implement(() =>
        createGitChild({
          stdout: ErrorMessageStub({ value: '' }),
          exitCode: ExitCodeStub({ value: 128 }),
        }),
      );
    },

    // Proves the OTHER scopes never reach for an upstream — the property that keeps them untouched
    // by this parameter rather than merely untested against it.
    wasUpstreamAsked: (): boolean => spawnHandle.callsMatching(['git', UPSTREAM_ARGS]).length > 0,

    getGitDiffArgs: (): unknown => gitDiffProxy.getSpawnedArgs(),

    getGitDiffCwd: (): unknown => gitDiffProxy.getSpawnedCwd(),

    // Every git argv the broker spawned, in order — the `working-tree` scope's two readings need
    // both, and getGitDiffArgs answers only the last.
    getGitArgsList: (): readonly unknown[] => workingTreeProxy.getSpawnedArgsList(),
  };
};
