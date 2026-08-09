import type {
  AbsoluteFilePathStub,
  ProcessId,
  QuestBranchNameStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
  RepoRootCwdStub,
} from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questBlockOnFailureBrokerProxy } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker.proxy';
import { questCwdResolveBroker } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { worktreeResumeRestoreBrokerProxy } from '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker.proxy';
import type { CapturedOrchestrationEmit } from '../../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationResumeResponder } from './orchestration-resume-responder';

// questCwdResolveBroker has its own dedicated fs-backed test suite
// (quest-cwd-resolve-broker.test.ts). Mocking the module and addressing by questId sidesteps
// re-deriving realistic fs state for it here on top of what get/modify already stage for the SAME
// default guildId+folder every QuestStub shares — the established pattern for a broker that owns
// its own test suite (scan-once-layer-broker.proxy.ts does the same).
registerModuleMock({ module: '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker' });

type Quest = ReturnType<typeof QuestStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;
type QuestBranchName = ReturnType<typeof QuestBranchNameStub>;
type RepoRootCwd = ReturnType<typeof RepoRootCwdStub>;

export const OrchestrationResumeResponderProxy = (): {
  callResponder: typeof OrchestrationResumeResponder;
  setupQuestFound: (params: { quest: Quest; rearmWrites?: number }) => void;
  setupQuestNotFound: () => void;
  setupModifyReject: (params: { error: Error }) => void;
  setupWorktreeMissing: (params: { quest: Quest; worktreePath: AbsoluteFilePath }) => void;
  setupWorktreeDrifted: (params: {
    quest: Quest;
    cwd: RepoRootCwd;
    branchName: QuestBranchName;
    currentBranchName: string;
  }) => void;
  setupWorktreeOnBranch: (params: {
    quest: Quest;
    cwd: RepoRootCwd;
    branchName: QuestBranchName;
  }) => void;
  setupWorktreeRestoreFails: (params: {
    quest: Quest;
    cwd: RepoRootCwd;
    branchName: QuestBranchName;
    currentBranchName: string;
    output: string;
  }) => void;
  getWorktreeRestoreSpawnedArgs: () => readonly unknown[];
  getBlockOnFailureCalls: () => readonly unknown[];
  getStderrWrites: () => readonly unknown[];
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => ReturnType<typeof questContract.parse>;
  getPersistedQuestAt: (params: { index: number }) => ReturnType<typeof questContract.parse>;
  getRegisteredProcessIds: () => readonly ProcessId[];
  getEmittedResumeEvents: () => readonly CapturedOrchestrationEmit[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildGetProxy = guildGetBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  const worktreeRestoreProxy = worktreeResumeRestoreBrokerProxy();
  // The block-on-failure route is stubbed here (its own proxy's default resolves { blocked: true }
  // without touching fs) so this responder's tests never depend on questBlockOnFailureBroker's own
  // internals — those are covered by its own test suite. Reach around its semantic surface (it
  // exposes no call-inspection method of its own) the same way blockOnMissingWorktreeLayerBroker's
  // proxy does, for the sibling halt route this one mirrors.
  questBlockOnFailureBrokerProxy();
  const blockOnFailureMock = questBlockOnFailureBroker as jest.MockedFunction<
    typeof questBlockOnFailureBroker
  >;
  const eventsProxy = orchestrationEventsStateProxy();
  const emittedResumeEvents = eventsProxy.captureEmits({ type: 'quest-resumed' });
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  // Registered for enforce-proxy-child-creation only: questCwdResolveBroker is module-mocked
  // above (per-questId addressing, see the comment on that registerModuleMock call), so this
  // child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();
  const cwdResolveMock = registerMock({ fn: questCwdResolveBroker });
  const defaultRepoRoot = RepoRootCwdStub({ value: '/test/repo/root' });

  registerSpyOn({ object: crypto, method: 'randomUUID' })
    .calledWith([])
    .returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  // process.stderr.write is a single shared spy across every proxy composed into this test file.
  // quest-orchestration-loop-broker.proxy.ts (constructed above via questOrchestrationLoopBrokerProxy())
  // already stages the generic `calledWith([])` catch-all this responder's own writes answer
  // through — a second `calledWith([])` registration here would collide (later-wins) rather than
  // add coverage, so this proxy only READS the shared spy, filtering its own prefix out of every
  // call recorded on it.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });

  return {
    callResponder: OrchestrationResumeResponder,

    // The whole chain is FIFO-queued file I/O, so slots must be staged in the order the responder
    // calls them. `rearmWrites` is how many work-item rearm modifies the blocked path performs
    // BEFORE the status flip (1 when the quest has resumable wreckage, 0 otherwise) — a paused
    // quest never rearms, so it defaults to none.
    setupQuestFound: ({ quest, rearmWrites = 0 }: { quest: Quest; rearmWrites?: number }): void => {
      // Initial questGetBroker load.
      getProxy.setupQuestFound({ quest });
      // Every quest defaults to the transparent repo-root resolution — the shape a QuestStub with
      // no worktreePath is meant to take — so the worktree gate is invisible to every test that
      // isn't specifically about it. setupWorktreeMissing/Drifted/OnBranch below override this via
      // a live one-shot at the same address, which wins on the first call regardless of whether it
      // was staged before or after this sticky default.
      cwdResolveMock
        .calledWith([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'repo-root', cwd: defaultRepoRoot }));
      // questModifyBroker work-item rearm (blocked path only).
      Array.from({ length: rearmWrites }).forEach(() => {
        modifyProxy.setupQuestFound({ quest });
      });
      // questModifyBroker flip-status + clear pausedAtStatus.
      modifyProxy.setupQuestFound({ quest });
      // Re-fetch after modify.
      getProxy.setupQuestFound({ quest });

      // Inline launch dispatch mirrors RecoverGuildLayerResponder. Wire the full chain:
      // - questFindQuestPathBroker → guildId
      // - guildGetBroker → guild.path
      // - questModifyBroker additional call (inline orphan reset, conditional on orphaned
      //   active work items)
      // - questOrchestrationLoopBroker (layer brokers auto-resolve to undefined)

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

      guildGetProxy.setupConfig({
        config: GuildConfigStub({
          guilds: [
            GuildStub({
              id: guildId,
              path: FilePathStub({ value: '/home/user/test-guild' }) as never,
            }),
          ],
        }),
      });

      // Spare modify slots. Beyond the status flip, a resume fires up to two more
      // modifyQuestBroker calls — the blocked-path work-item rearm and the inline orphan reset —
      // each conditional on there being something to write, so unused slots are just headroom.
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    // Standalone — deliberately does NOT call setupQuestFound's full launch-chain staging, since
    // a missing worktree returns before any of that is reached. Only the responder's own initial
    // questGetBroker load needs a real fs slot; the block-via-work-item route is the stubbed
    // questBlockOnFailureBroker composed above. The modify slot below is only consumed on the
    // no-work-items path, which writes `status: 'blocked'` directly via the real questModifyBroker.
    setupWorktreeMissing: ({
      quest,
      worktreePath,
    }: {
      quest: Quest;
      worktreePath: AbsoluteFilePath;
    }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      cwdResolveMock
        .calledWith([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'missing-worktree', worktreePath }));
    },

    // Overrides setupQuestFound's sticky repo-root default for exactly one call — call this
    // either before or after setupQuestFound. Stages the underlying git spawn so the real
    // worktreeResumeRestoreBroker runs: a rev-parse that reports currentBranchName, then a
    // checkout that lands the quest branch.
    setupWorktreeDrifted: ({
      quest,
      cwd,
      branchName,
      currentBranchName,
    }: {
      quest: Quest;
      cwd: RepoRootCwd;
      branchName: QuestBranchName;
      currentBranchName: string;
    }): void => {
      cwdResolveMock
        .onceFor([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd }));
      worktreeRestoreProxy.setupDrifted({ currentBranchName });
      worktreeRestoreProxy.setupCheckoutSucceeds({ branchName });
    },

    // Same override, for the drift-free case: rev-parse already reports branchName, so the real
    // broker never spawns a checkout.
    setupWorktreeOnBranch: ({
      quest,
      cwd,
      branchName,
    }: {
      quest: Quest;
      cwd: RepoRootCwd;
      branchName: QuestBranchName;
    }): void => {
      cwdResolveMock
        .onceFor([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd }));
      worktreeRestoreProxy.setupOnBranch({ branchName });
    },

    // Same drift setup as setupWorktreeDrifted, but the checkout itself fails — proves the
    // responder logs and proceeds instead of blocking on a failed re-checkout.
    setupWorktreeRestoreFails: ({
      quest,
      cwd,
      branchName,
      currentBranchName,
      output,
    }: {
      quest: Quest;
      cwd: RepoRootCwd;
      branchName: QuestBranchName;
      currentBranchName: string;
      output: string;
    }): void => {
      cwdResolveMock
        .onceFor([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd }));
      worktreeRestoreProxy.setupDrifted({ currentBranchName });
      worktreeRestoreProxy.setupCheckoutFails({ branchName, output });
    },

    getWorktreeRestoreSpawnedArgs: (): readonly unknown[] =>
      worktreeRestoreProxy.getSpawnedArgsList(),

    getBlockOnFailureCalls: (): readonly unknown[] =>
      blockOnFailureMock.mock.calls.map((call) => call[0]),

    // Filters the shared process.stderr.write spy down to this responder's own lines — see the
    // constructor comment on stderrSpy for why this reads rather than re-registers the address.
    getStderrWrites: (): readonly unknown[] =>
      stderrSpy
        .callsMatching([])
        .map((call) => call[0])
        .filter((message) => String(message).startsWith('[orchestration-resume]')),

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getLastPersistedQuest: (): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(lastWrite)));
    },

    // A resume writes in a fixed order — rearm (blocked path only), then the status flip — so the
    // index is what lets a test assert the rearm landed BEFORE the quest became dispatchable.
    getPersistedQuestAt: ({ index }: { index: number }): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      return questContract.parse(JSON.parse(String(persisted[index])));
    },

    getRegisteredProcessIds: (): readonly ProcessId[] => orchestrationProcessesState.getAll(),

    getEmittedResumeEvents: (): readonly CapturedOrchestrationEmit[] => emittedResumeEvents,
  };
};
