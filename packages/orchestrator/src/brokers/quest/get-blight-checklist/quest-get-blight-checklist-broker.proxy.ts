/**
 * PURPOSE: Proxy for quest-get-blight-checklist-broker that mocks quest find/load, the quest's
 * cwd resolution (worktree / repo-root / missing-worktree), and the git diff
 *
 * USAGE:
 * const proxy = questGetBlightChecklistBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });
 * proxy.setupQuestNotFound();
 */

import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  RepoRootCwdStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { gitDiffFilesAdapterProxy } from '../../../adapters/git/diff-files/git-diff-files-adapter.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
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

export const questGetBlightChecklistBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupDiff: (params: { files: readonly string[] }) => void;
  setupWorktree: (params: { quest: Quest; worktreePath: string }) => void;
  setupWorktreeMissing: (params: { quest: Quest; worktreePath: string }) => void;
  getGitDiffArgs: () => unknown;
  getGitDiffCwd: () => unknown;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so this child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();
  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  const gitDiffProxy = gitDiffFilesAdapterProxy();

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

    getGitDiffArgs: (): unknown => gitDiffProxy.getSpawnedArgs(),

    getGitDiffCwd: (): unknown => gitDiffProxy.getSpawnedCwd(),
  };
};
