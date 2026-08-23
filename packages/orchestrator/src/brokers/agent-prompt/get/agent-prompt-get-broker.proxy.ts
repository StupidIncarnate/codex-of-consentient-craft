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
 */

import { pathJoinAdapterProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  repoRootCwdContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { gitHeadShaAdapterProxy } from '../../../adapters/git/head-sha/git-head-sha-adapter.proxy';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questOperationsUpdateBroker } from '../../quest/operations-update/quest-operations-update-broker';
import { questOperationsUpdateBrokerProxy } from '../../quest/operations-update/quest-operations-update-broker.proxy';

registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });
registerModuleMock({ module: '../../quest/operations-update/quest-operations-update-broker' });

type Quest = ReturnType<typeof QuestStub>;

const WORKTREE_CWD = repoRootCwdContract.parse('/home/testuser/worktrees/quest-abc12345');
const REPO_ROOT_CWD = repoRootCwdContract.parse('/home/testuser/my-guild');

// The broker builds startPath as pathJoinAdapter([processCwdAdapter(), projectConfigFile]).
// pathJoinAdapterProxy() defaults to a real '/'-join and processCwdAdapterProxy() defaults to
// '/default/cwd' (both from @dungeonmaster/shared/testing), so this is the exact, real address
// dungeonmasterConfigResolveAdapter is called with on the flowrider/siegemaster branch.
const DEV_SERVER_CONFIG_START_PATH = FilePathStub({
  value: `/default/cwd/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
});

export const agentPromptGetBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupLockedQuest: (params: { quest: Quest }) => void;
  setupWorktreeHead: (params: { sha: string }) => void;
  setupWorktreeHeadUnreadable: () => void;
  setupCwdUnresolvable: () => void;
  getStampedWorkItems: () => readonly unknown[];
  getGitSpawnedArgs: () => unknown;
  setupDevServerConfig: (params: {
    config: ReturnType<ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['makeRealConfig']>;
  }) => void;
  setupDevServer: (params: { devCommand: string; port: number; webPort?: number }) => void;
  setupNoDevServerConfig: () => void;
  getDevServerConfigStartPath: () => ReturnType<
    ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['getResolvedStartPath']
  >;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  // Recovery I/O the broker performs for flowrider/siegemaster (dev-server config read). Existing
  // role tests (codeweaver/minion) never hit this branch, so it is never called for them; the
  // semantic methods below let dev-server tests stage the resolved config for the branch that
  // DOES call it.
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  processCwdAdapterProxy();

  // Runs REAL — its proxy mocks the spawn at the I/O boundary, addressed on the `git` command, so
  // the stamp reads a genuine `git rev-parse HEAD` exit code and stdout. Unstaged, any git call
  // THROWS, which is what proves the repo-root default never reaches git at all.
  const headShaProxy = gitHeadShaAdapterProxy();

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
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
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

      // pathJoin: questPath + quest.json
      pathJoinProxy.returns({ result: questFilePath });

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      lockedQuest.value = quest;
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
      headShaProxy.setupSuccess({ sha });
    },

    // A worktree resolves but `git rev-parse HEAD` fails — a checkout with no commits yet, or no
    // git at all. gitHeadShaAdapter answers null and the stamp records nothing.
    setupWorktreeHeadUnreadable: (): void => {
      mockedCwdResolve.mockResolvedValue({ kind: 'worktree', cwd: WORKTREE_CWD });
      headShaProxy.setupFailure();
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
    getGitSpawnedArgs: (): unknown => headShaProxy.getSpawnedArgs(),

    // Stage the resolved .dungeonmaster.json for the flowrider/siegemaster dev-server branch.
    setupDevServerConfig: ({
      config,
    }: {
      config: ReturnType<
        ReturnType<typeof dungeonmasterConfigResolveAdapterProxy>['makeRealConfig']
      >;
    }): void => {
      configProxy.setupConfigResolved({ startPath: DEV_SERVER_CONFIG_START_PATH, config });
    },

    // Stage a resolved config carrying a devServer block from raw command + port. Builds the
    // config via the config stub internally so siege dev-server tests don't construct contracts.
    setupDevServer: ({
      devCommand,
      port,
      webPort,
    }: {
      devCommand: string;
      port: number;
      webPort?: number;
    }): void => {
      const config = configProxy.makeConfigWithArgs({
        devServer: { devCommand, port, ...(webPort === undefined ? {} : { webPort }) },
      } as never);
      configProxy.setupConfigResolved({ startPath: DEV_SERVER_CONFIG_START_PATH, config });
    },

    // Stage the siegemaster branch resolving a config with NO devServer block —
    // the real DungeonmasterConfigStub() default (devServer is `.optional()`, no default),
    // matching a repo that has a .dungeonmaster.json but no devServer configured.
    setupNoDevServerConfig: (): void => {
      configProxy.setupConfigResolved({
        startPath: DEV_SERVER_CONFIG_START_PATH,
        config: configProxy.makeRealConfig(),
      });
    },

    // Capture the startPath the broker handed to dungeonmasterConfigResolveAdapter on the
    // flowrider/siegemaster branch — the regression guard asserts it resolves to a file (not the
    // bare cwd directory, whose dirname() walks above the repo root and misses
    // .dungeonmaster.json).
    getDevServerConfigStartPath: (): ReturnType<typeof configProxy.getResolvedStartPath> =>
      configProxy.getResolvedStartPath(),
  };
};
