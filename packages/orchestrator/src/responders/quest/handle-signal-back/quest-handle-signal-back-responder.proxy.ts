/**
 * PURPOSE: Proxy for QuestHandleSignalBackResponder — runs the responder's real broker chain
 * (questGetBroker, questOperationsUpdateBroker, questAdvanceBroker, questBlockOnFailureBroker)
 * with only the fs adapters mocked, and captures every persisted quest.json write.
 * `questCwdResolveBroker` is mocked at the module level (mirroring `guildGetBrokerProxy`'s pattern)
 * rather than composed via its own fs-simulation proxy: it drives an independent
 * find-quest-path + load + guild chain whose reads land on the SAME shared file-path addresses as
 * `getProxy`/`operationsUpdateProxy`/`advanceProxy` (same default guildId, same quest.folder), so
 * composing it inline would require staging order to exactly mirror real execution order across
 * every nested proxy including questOperationsUpdateBroker's own persist-path joins. That is far
 * too fragile for what this responder's tests need to verify — what the responder DOES with a
 * resolution, not how the resolution is computed, which quest-cwd-resolve-broker.test.ts already
 * covers exhaustively.
 *
 * `gitWorkingTreeFilesBroker` runs REAL below that: its own proxy mocks `spawn` at the I/O
 * boundary, addressed on the git argv, so the commit-before-signal gate exercises the genuine
 * tracked ∪ untracked union rather than a stubbed file list.
 *
 * USAGE:
 * const proxy = QuestHandleSignalBackResponderProxy();
 * proxy.setupSignalFlow({ quest, questAfterOutcome });
 * await proxy.callResponder({ questId, workItemId, signal: 'complete', operationStatus: 'done' });
 * const outcome = proxy.getPersistedQuestAt({ index: 0 });
 *
 * The mocked filesystem is a FIFO read queue, not a store — a later load does NOT see an earlier
 * persist. Each setup method queues one read cycle per broker invocation the responder makes; the
 * brokers that re-read AFTER the outcome persist (advance's operations-update, the block broker's
 * get + modify) are fed `questAfterOutcome` — the quest as the outcome persist wrote it.
 *
 * The cwd resolution defaults to `repo-root`, which is what the real broker answers for a quest
 * carrying no `worktreePath` — the shape of every QuestStub that does not opt in — so the
 * commit-before-signal gate is skipped and no git command runs unless a test asks for a worktree
 * via setupWorktree.
 *
 * Date.prototype.toISOString is pinned to '2024-01-15T10:00:00.000Z' so completedAt / createdAt /
 * updatedAt stamps are deterministic. crypto.randomUUID passes through by default; the ids the
 * RESPONDER mints are queued via setupResponderUuids in the order it mints them — the pt
 * continuation is the only one — and advance's work-item id via setupAdvanceUuids (advance's own
 * proxy owns that spy — its stack frame matches first).
 */

import type { QuestStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import { questContract, repoRootCwdContract } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { gitWorkingTreeFilesBrokerProxy } from '../../../brokers/git/working-tree-files/git-working-tree-files-broker.proxy';
import { questAdvanceBrokerProxy } from '../../../brokers/quest/advance/quest-advance-broker.proxy';
import { questBlockOnFailureBrokerProxy } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker.proxy';
import { questCwdResolveBroker } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../../../brokers/quest/operations-update/quest-operations-update-broker.proxy';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';

registerModuleMock({
  module: '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker',
});

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;
type RepoRootCwd = ReturnType<typeof RepoRootCwdStub>;

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const WORKTREE_CWD = repoRootCwdContract.parse('/home/user/.dungeonmaster/worktrees/test-quest');
const REPO_ROOT_CWD = repoRootCwdContract.parse('/home/user/projects/demo');

export const QuestHandleSignalBackResponderProxy = (): {
  callResponder: typeof QuestHandleSignalBackResponder;
  setupQuestUnreadable: () => void;
  setupQuest: (params: { quest: Quest }) => void;
  setupSignalFlow: (params: { quest: Quest; questAfterOutcome: Quest }) => void;
  setupSignalBlocked: (params: { quest: Quest; questAfterOutcome: Quest }) => void;
  setupWorktree: (params: {
    trackedFiles: readonly string[];
    untrackedFiles: readonly string[];
  }) => RepoRootCwd;
  getCwdResolveCallArgs: () => readonly unknown[];
  getGitSpawnedArgsList: () => readonly unknown[];
  setupResponderUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupAdvanceUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Parsed[];
  getPersistedQuestAt: (params: { index: number }) => Parsed;
  getLastPersistedQuest: () => Parsed;
} => {
  const getProxy = questGetBrokerProxy();
  const operationsUpdateProxy = questOperationsUpdateBrokerProxy();
  const advanceProxy = questAdvanceBrokerProxy();
  // Stubbed ({ blocked: true }) by default; setupSignalBlocked swaps in the real broker so a test
  // can assert the actual blocked + skipped persisted outcome.
  const blockProxy = questBlockOnFailureBrokerProxy();
  // Runs REAL — this proxy mocks `spawn` at the I/O boundary, addressed on the git argv, so the
  // tracked ∪ untracked union under test is the genuine one. Unstaged, any git call THROWS, which
  // is what proves the gate never reaches git for a quest with no worktree.
  const workingTreeProxy = gitWorkingTreeFilesBrokerProxy();

  // Wired to satisfy enforce-proxy-child-creation (the implementation imports
  // questCwdResolveBroker) — never staged. The module mock above is the real staging mechanism;
  // see the docblock for why composing this proxy's own fs simulation is unsafe here.
  questCwdResolveBrokerProxy();

  // Default: the resolution a quest carrying no `worktreePath` really gets, so the
  // commit-before-signal gate skips and no git command runs. setupWorktree overrides it.
  const mockedCwdResolve = questCwdResolveBroker as jest.MockedFunction<
    typeof questCwdResolveBroker
  >;
  mockedCwdResolve.mockResolvedValue({ kind: 'repo-root', cwd: REPO_ROOT_CWD });

  // The pt-continuation operation id is minted in the responder's own update callback, so the
  // dispatch stack matches this proxy's handle (advance's id is minted in quest-advance-broker
  // frames and routes to the advance proxy's spy instead). Passthrough keeps unasserted ids real.
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  // Pins completedAt (responder callback), createdAt (advance callback), and updatedAt (both
  // persists AND the block path's questModifyBroker persist, which the operations-update proxy's
  // own pin does not reach — its handle only matches operations-update frames).
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    callResponder: QuestHandleSignalBackResponder,

    // questGetBroker resolves { success: false } — corrupt quest.json or unresolvable path. The
    // responder must throw (a silent success would drop the agent's signal).
    setupQuestUnreadable: (): void => {
      getProxy.setupEmptyFolder();
    },

    // Quest loads but the responder never persists (work item missing or already terminal) — only
    // the responder's own questGetBroker read cycle is queued.
    setupQuest: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    // Full non-blocking flow: responder get + the atomic outcome persist (reads `quest`) + the
    // advance that follows (reads `questAfterOutcome`, persisting only when a pending op remains).
    setupSignalFlow: ({
      quest,
      questAfterOutcome,
    }: {
      quest: Quest;
      questAfterOutcome: Quest;
    }): void => {
      getProxy.setupQuestFound({ quest });
      operationsUpdateProxy.setupQuestFound({ quest });
      advanceProxy.setupQuestFound({ quest: questAfterOutcome });
    },

    // Spent locked pt-chain flow: responder get + outcome persist, then the REAL block broker
    // (its own get + modify both read `questAfterOutcome`). Advance never runs on this path.
    setupSignalBlocked: ({
      quest,
      questAfterOutcome,
    }: {
      quest: Quest;
      questAfterOutcome: Quest;
    }): void => {
      getProxy.setupQuestFound({ quest });
      operationsUpdateProxy.setupQuestFound({ quest });
      blockProxy.setupPassthrough();
      blockProxy.setupQuestFound({ quest: questAfterOutcome });
    },

    // The quest owns a real worktree, whose tree carries exactly these paths. `[] + []` is the
    // clean-tree case the commit-before-signal gate accepts; anything else is the dirty-tree case
    // it refuses. Returns the cwd it staged, so a test can assert the git read ran against the
    // WORKTREE rather than the repo root.
    setupWorktree: ({
      trackedFiles,
      untrackedFiles,
    }: {
      trackedFiles: readonly string[];
      untrackedFiles: readonly string[];
    }): RepoRootCwd => {
      mockedCwdResolve.mockResolvedValue({ kind: 'worktree', cwd: WORKTREE_CWD });
      workingTreeProxy.setupWorkingTree({ trackedFiles, untrackedFiles });
      return WORKTREE_CWD;
    },

    // Raw call args, not a count — the test derives .length itself (ban-primitives forbids a raw
    // number return type here).
    getCwdResolveCallArgs: (): readonly unknown[] => mockedCwdResolve.mock.calls,

    // Every `git` argv the gate actually spawned. Empty proves the gate never reached git — which
    // is the assertion that a role outside CODE_CHANGING_ROLES pays no git cost.
    getGitSpawnedArgsList: (): readonly unknown[] => workingTreeProxy.getSpawnedArgsList(),

    setupResponderUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },

    setupAdvanceUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      advanceProxy.setupUuids({ ids });
    },

    // Every quest.json write across the whole flow — the write-file mock entry is shared, so the
    // block path's questModifyBroker persist lands here alongside the operations-update persists.
    getAllPersistedContents: (): readonly unknown[] =>
      operationsUpdateProxy.getAllPersistedContents(),

    getAllPersistedQuests: (): readonly Parsed[] => operationsUpdateProxy.getAllPersistedQuests(),

    getPersistedQuestAt: ({ index }: { index: number }): Parsed => {
      const writes = operationsUpdateProxy.getAllPersistedContents();
      return questContract.parse(JSON.parse(String(writes[index])));
    },

    getLastPersistedQuest: (): Parsed => {
      const writes = operationsUpdateProxy.getAllPersistedContents();
      return questContract.parse(JSON.parse(String(writes[writes.length - 1])));
    },
  };
};
