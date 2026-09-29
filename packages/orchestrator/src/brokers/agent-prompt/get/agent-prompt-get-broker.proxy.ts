/**
 * PURPOSE: Proxy for agent-prompt-get-broker that wires the quest-find + quest-load mock chain
 *
 * USAGE:
 * const proxy = agentPromptGetBrokerProxy();
 * proxy.setupQuestFound({ quest });
 *
 * `questCwdResolveBroker` and `questOperationsUpdateBroker` — the start-ref stamp's two brokers —
 * are mocked at the MODULE boundary rather than composed. Each drives its own find-quest-path +
 * load chain onto the SAME shared file-path addresses `setupQuestFound` already queues, so
 * composing them would make every test's staging order mirror real execution order across two more
 * nested proxies. Their own colocated suites cover how each behaves; what these tests need is what
 * the broker DOES with a resolution and what it hands the persist.
 *
 * The default resolution is `repo-root`, which is what a quest carrying no `worktreePath` — the
 * shape of every QuestStub that does not opt in — really gets, so the stamp short-circuits before
 * any git spawn and no test that is not about it pays for it. `setupWorktreeHead` opts in.
 *
 * `join` is mocked directly on the `#gateway/node/path` specifier (no per-function wrapper to
 * compose), addressed by the EXACT [questPath, quest.json] tuple.
 */

import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  repoRootCwdContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { headShaProxy } from '#gateway/bin/git/head-sha/head-sha.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questOperationsUpdateBroker } from '../../quest/operations-update/quest-operations-update-broker';
import { questOperationsUpdateBrokerProxy } from '../../quest/operations-update/quest-operations-update-broker.proxy';

registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });
registerModuleMock({ module: '../../quest/operations-update/quest-operations-update-broker' });

type Quest = ReturnType<typeof QuestStub>;
type FilePathValue = ReturnType<typeof FilePathStub>;

const WORKTREE_CWD = repoRootCwdContract.parse('/home/testuser/worktrees/quest-abc12345');
const REPO_ROOT_CWD = repoRootCwdContract.parse('/home/testuser/my-guild');

export const agentPromptGetBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => { questFolderPath: FilePathValue };
  setupLockedQuest: (params: { quest: Quest }) => void;
  setupWorktreeHead: (params: { sha: string }) => void;
  setupWorktreeHeadUnreadable: () => void;
  setupCwdUnresolvable: () => void;
  getStampedWorkItems: () => readonly unknown[];
  getGitSpawnedArgs: () => unknown;
  getQuestFileJoinArgs: (params: {
    questFolderPath: FilePathValue;
  }) => readonly unknown[] | undefined;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();

  // Runs REAL — its proxy mocks the spawn at the I/O boundary, addressed on the `git` command, so
  // the stamp reads a genuine `git rev-parse HEAD` exit code and stdout. Unstaged, any git call
  // THROWS, which is what proves the repo-root default never reaches git at all.
  const gitHeadShaProxy = headShaProxy();

  // The stamp's best-effort catch writes to stderr; composed so no test reaches the real stream.
  stderrProxy();

  // Wired to satisfy enforce-proxy-child-creation (the implementation imports both) — never
  // staged. The module mocks above are the real staging mechanism; see the docblock.
  questCwdResolveBrokerProxy();
  questOperationsUpdateBrokerProxy();

  const mockedCwdResolve = questCwdResolveBroker as jest.MockedFunction<
    typeof questCwdResolveBroker
  >;
  mockedCwdResolve.mockResolvedValue({ kind: 'repo-root', cwd: REPO_ROOT_CWD });

  // Every `workItems` replacement the broker's update callback produced, in order. The mock stands
  // in for the real broker's contract and nothing more: call `update` with the loaded quest, treat
  // `null` as a no-op, otherwise apply. That is exactly enough to prove the stamp-once behaviour
  // without re-running the whole read-modify-write chain the broker's own suite covers.
  const stampedWorkItems: unknown[] = [];
  const mockedOperationsUpdate = questOperationsUpdateBroker as jest.MockedFunction<
    typeof questOperationsUpdateBroker
  >;
  // The quest the real broker would re-read INSIDE its per-quest lock. `setupQuestFound` points it
  // at the same quest the fs chain serves; `setupLockedQuest` points it somewhere else, which is
  // the only way to express the race the callback's own re-check exists for — two fetches on one
  // work item, the second arriving after the first already stamped.
  const lockedQuest: { value: Quest | null } = { value: null };
  mockedOperationsUpdate.mockImplementation(async ({ update }) => {
    const current = lockedQuest.value;
    if (current === null) {
      return Promise.resolve(null);
    }
    const changes = update({ quest: current });
    if (changes === null) {
      return Promise.resolve(null);
    }
    stampedWorkItems.push(changes.workItems);
    return Promise.resolve({ quest: current });
  });

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): { questFolderPath: FilePathValue } => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });
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

      // join: questPath + quest.json, addressed by the exact tuple the broker really passes.
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      lockedQuest.value = quest;

      return { questFolderPath };
    },

    // The quest.json the start-ref persist re-reads under the lock, when it differs from the one
    // the prompt fetch loaded. Stage a work item that ALREADY carries a startRef here to prove the
    // callback refuses to move it — the guard a crash-and-resume depends on.
    setupLockedQuest: ({ quest }: { quest: Quest }): void => {
      lockedQuest.value = quest;
    },

    // The quest owns a real worktree whose HEAD reads back this sha — the shape that stamps.
    setupWorktreeHead: ({ sha }: { sha: string }): void => {
      mockedCwdResolve.mockResolvedValue({ kind: 'worktree', cwd: WORKTREE_CWD });
      gitHeadShaProxy.setupResult({ exitCode: 0, output: `${sha}\n` });
    },

    // A worktree resolves but `git rev-parse HEAD` fails — a checkout with no commits yet, or no
    // git at all. gitHeadShaAdapter answers null and the stamp records nothing.
    setupWorktreeHeadUnreadable: (): void => {
      mockedCwdResolve.mockResolvedValue({ kind: 'worktree', cwd: WORKTREE_CWD });
      gitHeadShaProxy.setupResult({ exitCode: 128, output: '' });
    },

    // The cwd resolution THROWS — a quest whose guild is not in the registry, a quest.json written
    // straight to disk by a fixture, a filesystem that answered no. The stamp is best-effort, so
    // the prompt must still serve.
    setupCwdUnresolvable: (): void => {
      mockedCwdResolve.mockRejectedValue(new Error('Guild not found: 00000000-0000-0000-0000-0'));
    },

    // Every `workItems` replacement the stamp persisted, in order. EMPTY is the assertion that
    // nothing was written at all — the resume guard's whole claim.
    getStampedWorkItems: (): readonly unknown[] => stampedWorkItems,

    // The git argv the stamp actually spawned, or undefined when it never reached git.
    getGitSpawnedArgs: (): unknown => {
      const calls = gitHeadShaProxy.getCallsFor();
      const call = calls.at(0);
      if (call === undefined) {
        return undefined;
      }
      const first = call.at(0);
      if (typeof first === 'object' && first !== null && 'args' in first) {
        return Array.isArray(first.args) ? first.args : [];
      }
      return [];
    },

    // The join(questFolderPath, quest.json) args the broker itself invoked — the ONLY way to prove
    // its own join call resolved this exact folder rather than falling through to some OTHER
    // proxy's real-passthrough default for the same shared `join` (config-root/guild-path-walk-up
    // callers registered via questCwdResolveBrokerProxy compose a `[]` catch-all): a mismatched
    // filename here still computes A path, so `questLoadBrokerProxy`'s own path-blind read would
    // silently serve the right JSON at the wrong address without this assertion catching it.
    getQuestFileJoinArgs: ({
      questFolderPath,
    }: {
      questFolderPath: FilePathValue;
    }): readonly unknown[] | undefined => joinHandle.callsMatching([questFolderPath]).at(0),
  };
};
