import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';
import {
  ExitCodeStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
  questContract,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { chatSpawnBrokerProxy } from '../../../brokers/chat/spawn/chat-spawn-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import type { CapturedOrchestrationEmit } from '../../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { FollowupChatStartResponder } from './followup-chat-start-responder';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;
type WorktreePath = NonNullable<Quest['worktreePath']>;

// crypto.randomUUID is sticky-mocked to this literal by chatSpawnBrokerProxy's own constructor
// (its last registration wins over agentLaunchBrokerProxy's own uuid mock). FollowupChatStartResponder
// mints a fresh tavernkeeper work item id off the SAME global mock, so this is the id it computes
// whenever no existing item is found — matching the literal design-chat-start-responder.test.ts
// asserts for its own crypto.randomUUID-minted glyphWorkItemId.
const MINTED_WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

// Pins createdAt/startedAt/completedAt (this responder's own timestamps) AND quest.updatedAt
// (questModifyBroker's own stamp) to one fixed value, so persisted-quest assertions don't chase
// the real wall clock. toISOString takes no identifying argument — [] is the honest address.
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

// Address for chatSpawnBrokerProxy's own bundled quest/cwd staging below (setupResumeSession /
// setupResumeWithWorktree / setupResumeWithMissingWorktree). Every one of those methods carries a
// chaoswhisperer-shaped quest this proxy never uses for its actual assertions — this responder's
// own questId/quest are staged separately, directly, via questGetBrokerProxy/questModifyBrokerProxy
// below. Using a DIFFERENT id here keeps that bundled staging at its own, never-queried path so it
// can never collide with (or shadow) this proxy's own tavernkeeper-quest reads.
const CWD_STAGING_QUEST_ID = QuestIdStub({ value: 'followup-cwd-staging-quest' });
const CWD_STAGING_SESSION_ID = SessionIdStub({ value: 'followup-cwd-staging-session' });

export const FollowupChatStartResponderProxy = (): {
  callResponder: typeof FollowupChatStartResponder;
  setupNewTavernkeeperItem: (params: { quest: Quest; stdoutLines?: readonly string[] }) => void;
  setupExistingTavernkeeperItem: (params: {
    quest: Quest;
    stdoutLines?: readonly string[];
  }) => void;
  setupQuestNotFound: () => void;
  setupWorktreeMissing: (params: { quest: Quest }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
  getLastPersistedQuest: () => Parsed;
  captureEmits: (params: { type: OrchestrationEventType }) => readonly CapturedOrchestrationEmit[];
} => {
  // Guild default staging, the questModifyBroker auto-mock, and the launcher's crypto.randomUUID +
  // chatStreamProcessHandle + main-tail + kill-layer + spawn-adapter wiring — everything
  // chatSpawnBroker's real internal chain needs to complete a full spawn. This proxy's own quest-
  // resolution scenario methods (setupGlyphsmithSession, setupSessionLinkQuest, ...) are never
  // called directly — they are chaoswhisperer/glyphsmith-shaped and cannot address a tavernkeeper
  // quest. Only its spawn-adapter-level methods (setupResumeSession, setupResumeWithWorktree,
  // setupResumeWithMissingWorktree, getSpawnedArgs) are used below, addressed so their OWN bundled
  // quest resolution never collides with this responder's real reads (see CWD_STAGING_QUEST_ID).
  const spawnProxy = chatSpawnBrokerProxy();
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);
  // FollowupChatStartResponder's OWN questGetBroker calls: its own pre-check, PLUS (staged as
  // additional calls below) the two chatSpawnBroker performs internally on its behalf
  // (resolveChatQuestLayerBroker's tavernkeeper lookup, questCwdResolveBroker's own lookup).
  const getProxy = questGetBrokerProxy();
  // FollowupChatStartResponder's OWN questModifyBroker persist call(s).
  const modifyProxy = questModifyBrokerProxy();
  const processStateProxy = orchestrationProcessesStateProxy();
  processStateProxy.setupEmpty();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();

  // Stages the spawn adapter (custom stdout lines, exitCode 0) and the worktree-accessibility
  // check for `worktreePath`. fsIsAccessibleAdapter is addressed by the exact path VALUE, so
  // routing it through chatSpawnBrokerProxy's own setupResumeWithWorktree — despite that method's
  // OWN bundled (unused) quest — still answers THIS responder's real accessibility check.
  // setupResumeSession is staged FIRST so its stdout-lines spawn-emit wins the FIFO queue over
  // setupResumeWithWorktree's own (always-empty-lines) spawn-emit.
  const stageAccessibleSpawn = ({
    worktreePath,
    stdoutLines,
  }: {
    worktreePath: WorktreePath;
    stdoutLines?: readonly string[];
  }): void => {
    spawnProxy.setupResumeSession({
      exitCode: ExitCodeStub({ value: 0 }),
      stdoutLines: stdoutLines ?? [],
    });
    spawnProxy.setupResumeWithWorktree({
      questId: CWD_STAGING_QUEST_ID,
      sessionId: CWD_STAGING_SESSION_ID,
      worktreePath,
    });
  };

  return {
    callResponder: FollowupChatStartResponder,

    // No existing tavernkeeper item on `quest`. Stages the "before" read for the responder's own
    // pre-check AND its own questModifyBroker persist (both see the item-less quest), then the
    // "after" reads for chatSpawnBroker's internal resolution + cwd lookups (both see the quest
    // WITH the freshly-minted item this responder is about to persist) — mirroring the real
    // sequence: read, persist, THEN chatSpawnBroker re-reads the now-persisted file.
    setupNewTavernkeeperItem: ({
      quest,
      stdoutLines,
    }: {
      quest: Quest;
      stdoutLines?: readonly string[];
    }): void => {
      if (quest.worktreePath === undefined) {
        throw new Error(
          'FollowupChatStartResponderProxy.setupNewTavernkeeperItem: quest.worktreePath must be set',
        );
      }

      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });

      const afterQuest = QuestStub({
        ...quest,
        workItems: [
          ...quest.workItems,
          WorkItemStub({
            id: MINTED_WORK_ITEM_ID,
            role: 'tavernkeeper',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [],
            dependsOn: [],
          }),
        ],
      });
      getProxy.setupQuestFound({ quest: afterQuest }); // resolveChatQuestLayerBroker's own lookup
      getProxy.setupQuestFound({ quest: afterQuest }); // questCwdResolveBroker's own lookup
      // onComplete's own fire-and-forget questModifyBroker call (marking the item complete) loads
      // the quest AGAIN before merging — a fifth cycle, seeing the now-persisted afterQuest.
      modifyProxy.setupQuestFound({ quest: afterQuest });
      stageAccessibleSpawn({
        worktreePath: quest.worktreePath,
        ...(stdoutLines === undefined ? {} : { stdoutLines }),
      });
    },

    // `quest` already carries a tavernkeeper work item (whatever sessionId/status the test wants).
    // No mutation of workItems membership happens, so every read cycle sees the SAME quest.
    setupExistingTavernkeeperItem: ({
      quest,
      stdoutLines,
    }: {
      quest: Quest;
      stdoutLines?: readonly string[];
    }): void => {
      if (quest.worktreePath === undefined) {
        throw new Error(
          'FollowupChatStartResponderProxy.setupExistingTavernkeeperItem: quest.worktreePath must be set',
        );
      }

      getProxy.setupQuestFound({ quest }); // this responder's own pre-check
      modifyProxy.setupQuestFound({ quest }); // this responder's own persist's internal load
      getProxy.setupQuestFound({ quest }); // resolveChatQuestLayerBroker's own lookup
      getProxy.setupQuestFound({ quest }); // questCwdResolveBroker's own lookup
      // onComplete's own fire-and-forget questModifyBroker call (marking the item complete) loads
      // the quest AGAIN before merging — a fifth cycle. Item presence never changes for an already-
      // existing item, so it sees the same quest.
      modifyProxy.setupQuestFound({ quest });
      stageAccessibleSpawn({
        worktreePath: quest.worktreePath,
        ...(stdoutLines === undefined ? {} : { stdoutLines }),
      });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    // `quest` already carries a tavernkeeper item and a worktreePath, but the worktree directory
    // itself is gone. Stages every read the same as setupExistingTavernkeeperItem; only the
    // accessibility check fails, and no spawn is ever staged (the responder throws first).
    setupWorktreeMissing: ({ quest }: { quest: Quest }): void => {
      if (quest.worktreePath === undefined) {
        throw new Error(
          'FollowupChatStartResponderProxy.setupWorktreeMissing: quest.worktreePath must be set',
        );
      }

      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      spawnProxy.setupResumeWithMissingWorktree({
        questId: CWD_STAGING_QUEST_ID,
        sessionId: CWD_STAGING_SESSION_ID,
        worktreePath: quest.worktreePath,
      });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    // The cwd chatSpawnBroker actually launched the tavernkeeper process with — the sole
    // evidence that separates "spawned in the quest's worktree" from "spawned at the repo root".
    getSpawnedCwd: (): unknown => spawnProxy.getSpawnedCwd(),

    getLastPersistedQuest: (): Parsed => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(lastWrite)));
    },

    captureEmits: ({
      type,
    }: {
      type: OrchestrationEventType;
    }): readonly CapturedOrchestrationEmit[] => eventsProxy.captureEmits({ type }),
  };
};
