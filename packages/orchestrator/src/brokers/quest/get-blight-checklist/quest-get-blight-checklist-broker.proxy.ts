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

import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { RepoRootCwdStub } from '@dungeonmaster/shared/contracts/repo-root-cwd/repo-root-cwd.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';
import { diffFilesProxy } from '#gateway/bin/git/diff-files/diff-files.proxy';
import { upstreamShaProxy } from '#gateway/bin/git/upstream-sha/upstream-sha.proxy';

import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { gitWorkingTreeFilesBrokerProxy } from '../../git/working-tree-files/git-working-tree-files-broker.proxy';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

// The checklist's cwd resolution is mocked at the module boundary.
registerModuleMock({ module: '../cwd-resolve/quest-cwd-resolve-broker' });

type Quest = ReturnType<typeof QuestStub>;
type FilePathValue = string;

const DEFAULT_REPO_ROOT = RepoRootCwdStub({ value: '/home/testuser/my-guild' });

const isString = (arg: unknown): boolean => typeof arg === 'string';

const isDiffHeadRevision = (arg: unknown): boolean =>
  typeof arg === 'string' && arg.endsWith('...HEAD');

const extractLastDiffCall = (
  diffCalls: readonly unknown[][],
): { args: unknown; cwd: unknown } | undefined => {
  const lastCall = diffCalls.at(-1);
  if (lastCall === undefined) {
    return undefined;
  }
  const item = lastCall.at(0);
  if (typeof item === 'object' && item !== null) {
    const args = 'args' in item && Array.isArray(item.args) ? item.args : undefined;
    const cwd = 'cwd' in item ? item.cwd : undefined;
    return { args, cwd };
  }
  return undefined;
};

export const questGetBlightChecklistBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => {
    questFolderPath: FilePathValue;
    questFilePath: FilePathValue;
  };
  setupQuestNotFound: () => void;
  getQuestFileJoinArgs: (params: {
    questFolderPath: FilePathValue;
  }) => readonly unknown[] | undefined;
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
  const joinHandle: MockHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so this child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();
  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  const diffProxy = diffFilesProxy();
  const workingTreeProxy = gitWorkingTreeFilesBrokerProxy();
  const upstreamProxy = upstreamShaProxy();

  return {
    setupQuestFound: ({
      quest,
    }: {
      quest: Quest;
    }): { questFolderPath: FilePathValue; questFilePath: FilePathValue } => {
      const guildId = GuildIdStub();
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: guildId,
            questsDirPath,
            questFolders: [
              {
                folderName: quest.folder,
                questFilePath,
                questFolderPath,
                contents: JSON.stringify(quest),
              },
            ],
          },
        ],
      });

      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Sensible default: the repo-root resolution, matching the shape every QuestStub (no
      // worktreePath) takes — so the worktree-vs-repo-root distinction stays transparent to
      // every test that isn't specifically about it. setupWorktree / setupWorktreeMissing below
      // override this default for exactly one call via `onceFor`.
      cwdMock
        .calledWith([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'repo-root', cwd: DEFAULT_REPO_ROOT }));

      return { questFolderPath, questFilePath };
    },

    setupQuestNotFound: (): void => {
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },

    setupDiff: ({ files }: { files: readonly string[] }): void => {
      diffProxy.returnsMatchingRevisionArg({
        revisionArg: isDiffHeadRevision,
        exitCode: 0,
        output: files.join('\n'),
      });
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
          worktreePath: worktreePath,
        }),
      );
    },

    // What `git rev-parse @{upstream}` answers in the quest's checkout — the base
    // `scope: 'unpushed'` measures its round from.
    setupUpstream: ({ sha }: { sha: string }): void => {
      upstreamProxy.setupResult({ exitCode: 0, output: sha });
    },

    // A branch tracking nothing. Real state, not an error: it is what a quest carved before
    // riftcarver started pushing looks like, and it is what sends the scope to its baseRef fallback.
    setupNoUpstream: (): void => {
      upstreamProxy.setupResult({ exitCode: 128, output: 'fatal: no upstream configured' });
    },

    // Proves the OTHER scopes never reach for an upstream — the property that keeps them untouched
    // by this parameter rather than merely untested against it.
    wasUpstreamAsked: (): boolean => upstreamProxy.getCallsFor().length > 0,

    getGitDiffArgs: (): unknown => {
      const diffCalls = diffProxy.getCallsFor({
        revisionArg: isString,
      });
      const last = extractLastDiffCall(diffCalls);
      if (last !== undefined) {
        return last.args;
      }
      if (upstreamProxy.getCallsFor().length > 0) {
        return ['rev-parse', '@{upstream}'];
      }
      return undefined;
    },

    getGitDiffCwd: (): unknown => {
      const diffCalls = diffProxy.getCallsFor({
        revisionArg: isString,
      });
      const last = extractLastDiffCall(diffCalls);
      if (last !== undefined) {
        return last.cwd;
      }
      return undefined;
    },

    // Every git argv the broker spawned, in order — the `working-tree` scope's two readings need
    // both, and getGitDiffArgs answers only the last.
    getGitArgsList: (): readonly unknown[] => workingTreeProxy.getSpawnedArgsList(),

    getQuestFileJoinArgs: ({
      questFolderPath,
    }: {
      questFolderPath: FilePathValue;
    }): readonly unknown[] | undefined => joinHandle.callsMatching([questFolderPath]).at(-1),
  };
};
