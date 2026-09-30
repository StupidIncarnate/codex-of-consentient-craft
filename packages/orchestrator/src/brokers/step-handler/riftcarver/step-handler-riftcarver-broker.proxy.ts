/**
 * PURPOSE: Proxy for stepHandlerRiftcarverBroker — composes the proxy beside every broker and
 * gateway call the handler makes and stages each one by its exact address: the quest file at its
 * path, each git probe by its ref, the collision probe and the node_modules mirror by the worktree
 * path, the result log by its id. Every broker in between (worktreePrepareBroker,
 * worktreeProvisionBroker and the mirror, seed and audit under it, questOperationsUpdateBroker,
 * riftcarverPersistResultBroker) runs REAL, and no fs adapter is replaced.
 *
 * USAGE:
 * const proxy = stepHandlerRiftcarverBrokerProxy();
 * proxy.setupQuest({ quest });
 * proxy.setupTypecheckFails({ lines: ['error TS2304'] });
 * const result = await stepHandlerRiftcarverBroker({ args: [], questId, workItemId, onLine: () => undefined });
 *
 * Every read of the quest file answers the SEEDED quest, including the read behind the result
 * append that follows the git-context write; see `getPersistedQuest`.
 */

import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { currentBranchProxy } from '#gateway/bin/git/current-branch/current-branch.proxy';
import { headShaProxy } from '#gateway/bin/git/head-sha/head-sha.proxy';
import { pushProxy } from '#gateway/bin/git/push/push.proxy';
import { upstreamShaProxy } from '#gateway/bin/git/upstream-sha/upstream-sha.proxy';
import { verifyRefProxy } from '#gateway/bin/git/verify-ref/verify-ref.proxy';

import { locationsWorktreePathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/worktree-path-find/locations-worktree-path-find-broker.proxy';
import { baseBranchNameContract, questBranchNameContract, riftcarverResultContract, type Quest } from '@dungeonmaster/shared/contracts';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

import { wardCommandStatics } from '../../../statics/ward-command/ward-command-statics';
import { gitDetectBaseBranchBrokerProxy } from '../../git/detect-base-branch/git-detect-base-branch-broker.proxy';
import { riftcarverPersistResultBrokerProxy } from '../../riftcarver/persist-result/riftcarver-persist-result-broker.proxy';
import { worktreePrepareBrokerProxy } from '../../worktree/prepare/worktree-prepare-broker.proxy';
import { worktreeProvisionBrokerProxy } from '../../worktree/provision/worktree-provision-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../../quest/operations-update/quest-operations-update-broker.proxy';
import { questRepoRootBrokerProxy } from '../../quest/repo-root/quest-repo-root-broker.proxy';

type QuestInput = ReturnType<typeof QuestStub>;

// The folder `questOperationsUpdateBrokerProxy.setupQuestOnDisk` stages the quest under; the
// result log lands beside that quest.json.
const QUESTS_DIR = `/home/testuser/.dungeonmaster/guilds/${GuildIdStub()}/quests`;

const REPO_ROOT = '/repo';
// Derived by questToGitNamesTransformer from QuestStub's own title ('Add Authentication') and id
// ('add-auth') — the same derivation the broker runs, restated here so every probe can be
// addressed by the exact ref and path the implementation will reach for.
const BRANCH_NAME = 'quest/add-authentication-add-auth';
const BASE_BRANCH = 'main';
const WORKTREE_PATH = `${REPO_ROOT}/worktrees/add-authentication-add-auth`;
const HEAD_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

const FIXED_RIFTCARVER_RESULT_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

const GIT_SUCCESS = 0;
const GIT_FAILURE = 128;
const TYPECHECK_FAILURE = 1;
// Matches stepHandlerRiftcarverBroker's own typecheck spawn — `wardCommandStatics.bin`, the same
// command name `step-handler-ward-broker.proxy.ts` stages on the shared `streamLines`/`spawn` mock.
// Staging stays deferred to `setupQuest`/`setupTypecheckFails` (never unconditional at
// construction) so an inert composition of this proxy — `stepHandlerRunBrokerProxy` builds one
// purely to satisfy `enforce-proxy-child-creation` — never registers an address the ward handler
// proxy's own staging could collide with.
const TYPECHECK_COMMAND = wardCommandStatics.bin;

export const stepHandlerRiftcarverBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  setupNoBaseBranch: () => void;
  setupBranchExistsInGit: () => void;
  setupWorktreeAddFails: (params: { output: string }) => void;
  setupWorktreeAddPermissionDenied: () => void;
  setupExistingWorktree: () => void;
  setupAlreadyPushed: () => void;
  setupPushFails: (params: { output: string }) => void;
  setupTypecheckFails: (params: { lines: readonly string[] }) => void;
  getPersistedQuest: () => Quest;
  getWorktreeAddSpawns: () => readonly unknown[];
  getTypecheckSpawns: () => readonly unknown[];
  getRiftcarverLogWrites: () => readonly { path: unknown; contents: unknown }[];
} => {
  stderrProxy();
  getEnvProxy();
  const typecheckSpawn = streamLinesProxy();
  locationsWorktreePathFindBrokerProxy();
  const isAccessibleProxy = pathExistsProxy();
  const gitCurrentBranchProxy = currentBranchProxy();
  const gitHeadShaProxy = headShaProxy();
  const gitPushProxy = pushProxy();
  const gitUpstreamProxy = upstreamShaProxy();
  const gitVerifyProxy = verifyRefProxy();
  const baseBranchProxy = gitDetectBaseBranchBrokerProxy();
  const persistResultProxy = riftcarverPersistResultBrokerProxy();
  const prepareProxy = worktreePrepareBrokerProxy();
  const provisionProxy = worktreeProvisionBrokerProxy();
  questFindQuestPathBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const updateProxy = questOperationsUpdateBrokerProxy();
  const repoRootProxy = questRepoRootBrokerProxy();
  repoRootProxy.setupRepoRoot({ repoRoot: REPO_ROOT });

  const worktreePath = WORKTREE_PATH;
  const riftcarverResultId = riftcarverResultContract.shape.id.parse(FIXED_RIFTCARVER_RESULT_UUID);
  const questFolderRef = { value: `${QUESTS_DIR}/unset` };

  // Whether the quest's own branch already resolves in git: decides whether the carve is a create
  // (`-b`) or an attach, and both are staged from this one flag.
  const questBranch: { exists: boolean; addFailureOutput: string | null } = {
    exists: false,
    addFailureOutput: null,
  };
  const typecheckOutcome: { exitCode: number; lines: readonly string[] } = {
    exitCode: GIT_SUCCESS,
    lines: ['✓ typecheck'],
  };

  const stageUpstream = ({ tracked }: { tracked: boolean }): void => {
    gitUpstreamProxy.setupResult(
      tracked
        ? { exitCode: GIT_SUCCESS, output: `${HEAD_SHA}\n` }
        : { exitCode: GIT_FAILURE, output: 'fatal: no upstream configured' },
    );
  };
  stageUpstream({ tracked: false });
  const stagePush = ({ exitCode, output }: { exitCode: number; output: string }): void => {
    gitPushProxy.setupUpstreamPush({ branchName: BRANCH_NAME, exitCode, output });
  };
  stagePush({ exitCode: GIT_SUCCESS, output: '' });

  // The collision probe's own ref check, staged BEFORE the carve so a probe the carve itself stages
  // on the same ref wins over it.
  const stageBranchProbe = (): void => {
    gitVerifyProxy.setupResult({
      ref: BRANCH_NAME,
      exitCode: questBranch.exists ? GIT_SUCCESS : GIT_FAILURE,
    });
  };
  const stageCarve = (): void => {
    stageBranchProbe();
    const branchName = questBranchNameContract.parse(BRANCH_NAME);
    const baseBranch = baseBranchNameContract.parse(BASE_BRANCH);
    if (questBranch.addFailureOutput !== null) {
      prepareProxy.setupWorktreeAddFails({
        worktreePath,
        branchName,
        baseBranch,
        output: String(questBranch.addFailureOutput),
      });
      return;
    }
    if (questBranch.exists) {
      prepareProxy.setupAttachExistingBranch({
        repoRoot: REPO_ROOT,
        worktreePath,
        branchName,
        sha: HEAD_SHA,
      });
      return;
    }
    prepareProxy.setupHappyPath({
      repoRoot: REPO_ROOT,
      worktreePath,
      branchName,
      baseBranch,
      sha: HEAD_SHA,
    });
  };

  // The typecheck spawn is staged per-quest inside `setupQuest`/`setupTypecheckFails` below, once
  // `typecheckOutcome` holds the scenario's real values.
  const stageTypecheckSpawn = (): void => {
    typecheckSpawn.setupSuccess({
      command: TYPECHECK_COMMAND,
      exitCode: Number(typecheckOutcome.exitCode),
      stdoutLines: typecheckOutcome.lines.map((line) => String(line)),
    });
  };

  const uuidSpy = registerMock({ fn: randomUUID });
  uuidSpy.calledWith([]).returns(FIXED_RIFTCARVER_RESULT_UUID as ReturnType<typeof randomUUID>);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      updateProxy.setupQuestOnDisk({ quest });
      getProxy.setupRealLookup({ questId: quest.id });
      questFolderRef.value = `${QUESTS_DIR}/${String(quest.folder)}`;

      baseBranchProxy.setupMainExists();
      // Nothing sits at the worktree path before the first carve.
      isAccessibleProxy.missing({ path: WORKTREE_PATH });
      stageCarve();
      provisionProxy.setupBareWorktree({
        repoRoot: REPO_ROOT,
        worktreePath,
      });
      persistResultProxy.setupSuccess({
        questFolderPath: questFolderRef.value,
        riftcarverResultId,
      });
      stageTypecheckSpawn();
      gitCurrentBranchProxy.setupFailure({ exitCode: 128, output: 'fatal: not a git repository' });
      gitHeadShaProxy.setupResult({ exitCode: 0, output: `${HEAD_SHA}\n` });
    },

    setupNoBaseBranch: (): void => {
      baseBranchProxy.setupNeitherExists();
    },

    setupBranchExistsInGit: (): void => {
      questBranch.exists = true;
      stageCarve();
    },

    setupWorktreeAddFails: ({ output }: { output: string }): void => {
      questBranch.addFailureOutput = output;
      stageCarve();
    },

    setupWorktreeAddPermissionDenied: (): void => {
      questBranch.addFailureOutput = `fatal: cannot mkdir ${WORKTREE_PATH}: Permission denied`;
      stageCarve();
    },

    setupExistingWorktree: (): void => {
      isAccessibleProxy.present({ path: WORKTREE_PATH });
      questBranch.exists = true;
      stageCarve();
      gitCurrentBranchProxy.setupBranch({ branch: BRANCH_NAME });
    },

    setupAlreadyPushed: (): void => {
      stageUpstream({ tracked: true });
    },

    setupPushFails: ({ output }: { output: string }): void => {
      stagePush({ exitCode: GIT_FAILURE, output });
    },

    setupTypecheckFails: ({ lines }: { lines: readonly string[] }): void => {
      typecheckOutcome.exitCode = TYPECHECK_FAILURE;
      typecheckOutcome.lines = lines.map((line) => line);
      // Re-stages the same address `setupQuest` already staged — the later registration wins (see
      // `mockStagedBestMatchTransformer`), so this overrides the green default without needing a
      // fresh proxy or a second construction.
      stageTypecheckSpawn();
    },

    // The LAST quest write. The result append reads the seeded quest rather than the git-context
    // write before it, so this carries the appended `riftcarverResults` and not the git context.
    getPersistedQuest: (): Quest => updateProxy.getLastPersistedQuest(),

    getWorktreeAddSpawns: (): readonly unknown[] =>
      prepareProxy
        .getSpawnedArgsList()
        .filter((args) => Array.isArray(args) && args[0] === 'worktree' && args[1] === 'add'),

    getTypecheckSpawns: (): readonly unknown[] => {
      const args = typecheckSpawn.getSpawnedArgs({ command: TYPECHECK_COMMAND });
      return typecheckSpawn
        .getOptionsFor({ command: TYPECHECK_COMMAND })
        .map((options) => ({ args, cwd: options.cwd }));
    },

    getRiftcarverLogWrites: (): readonly { path: unknown; contents: unknown }[] => {
      const contents = persistResultProxy.getWrittenContent({
        questFolderPath: questFolderRef.value,
        riftcarverResultId,
      });
      return contents === undefined
        ? []
        : [
            {
              path: persistResultProxy.getWrittenPath({
                questFolderPath: questFolderRef.value,
                riftcarverResultId,
              }),
              contents,
            },
          ];
    },
  };
};
