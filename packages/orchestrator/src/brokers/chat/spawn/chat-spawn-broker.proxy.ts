import type {
  AbsoluteFilePath,
  QuestId,
  QuestStub as QuestStubType,
  RepoRootCwd,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import {
  ExitCodeStub,
  QuestStub,
  RepoRootCwdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { agentLaunchBrokerProxy } from '../../agent/launch/agent-launch-broker.proxy';
import { chatStreamProcessHandleBrokerProxy } from '../stream-process-handle/chat-stream-process-handle-broker.proxy';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questModifyBrokerProxy } from '../../quest/modify/quest-modify-broker.proxy';
import { resolveChatQuestLayerBrokerProxy } from './resolve-chat-quest-layer-broker.proxy';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type Quest = ReturnType<typeof QuestStubType>;

type AgentLaunchProxy = ReturnType<typeof agentLaunchBrokerProxy>;

// crypto.randomUUID is mocked sticky to this value below (and questUserAddBroker mints the
// new quest's id from the same call), so this is the questId chatSpawnBroker's cwd
// resolution looks up immediately after a chaoswhisperer-new spawn creates a quest.
const CREATED_QUEST_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

// Legacy (no-worktreePath) quests resolve their cwd from the guild's repo root. The actual
// value is opaque to every scenario below except the ones that assert on it directly.
const DEFAULT_REPO_ROOT = RepoRootCwdStub({ value: '/home/user/my-guild' });

export const chatSpawnBrokerProxy = (): {
  setupNewSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupResumeSession: (params: {
    exitCode: ExitCode;
    stdoutLines?: readonly string[];
    sessionId?: SessionId;
    questId?: QuestId;
  }) => void;
  setupQuestCreationFailure: () => void;
  setupGlyphsmithSession: (params: {
    exitCode: ExitCode;
    quest: Quest;
    stdoutLines?: readonly string[];
  }) => void;
  setupQuestNotFound: () => void;
  setupInvalidStatus: (params: { quest: Quest }) => void;
  setupSessionLinkQuest: (params: { quest: Quest }) => void;
  setupSessionLinkReject: (params: { error: Error }) => void;
  setupStderrCapture: () => SpyOnHandle;
  setupResumeWithWorktree: (params: {
    questId: QuestId;
    sessionId: SessionId;
    worktreePath: AbsoluteFilePath;
  }) => void;
  setupResumeWithMissingWorktree: (params: {
    questId: QuestId;
    sessionId: SessionId;
    worktreePath: AbsoluteFilePath;
  }) => void;
  setupResumeWithRepoRoot: (params: {
    questId: QuestId;
    sessionId: SessionId;
    repoRoot: RepoRootCwd;
  }) => void;
  getSpawnedOptions: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
  // Delegated to agentLaunchBrokerProxy so callers (e.g. chat-start-responder tests) can
  // seed the post-exit main-session-tail mocks the launcher's onComplete starts. The
  // responder no longer touches chatMainSessionTailBroker directly — the launcher owns it.
  setupMainTailGuild: AgentLaunchProxy['setupMainTailGuild'];
  setupMainTailLines: AgentLaunchProxy['setupMainTailLines'];
  triggerMainTailChange: AgentLaunchProxy['triggerMainTailChange'];
} => {
  // chatSpawnBroker delegates spawn lifecycle to agentLaunchBroker; loading its proxy
  // wires up the transitive agent-spawn-unified + chat-stream-process-handle + main-tail
  // mocks the launcher composes around.
  const launchProxy = agentLaunchBrokerProxy();
  // chatStreamProcessHandleBroker is type-imported by chat-spawn-broker; this call satisfies
  // enforce-proxy-child-creation which tracks the import edge. The runtime mock is already
  // wired transitively via agentLaunchBrokerProxy so this is a registration-only invocation.
  chatStreamProcessHandleBrokerProxy();
  // chatSpawnBroker resolves the quest + chat work item via resolveChatQuestLayerBroker;
  // loading its proxy wires up questGetBroker + questUserAddBroker mocks the layer uses.
  const resolveProxy = resolveChatQuestLayerBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  // chatSpawnBroker reads the resolved quest's cwd via questCwdResolveBroker; loading its
  // proxy wires up the questGetBroker/questRepoRootBroker/fsIsAccessibleAdapter mocks that
  // decide the 'worktree' | 'repo-root' | 'missing-worktree' outcome.
  const cwdProxy = questCwdResolveBrokerProxy();

  registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(CREATED_QUEST_ID);

  return {
    setupNewSession: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: readonly string[];
    }): void => {
      // questUserAddBroker default mock (loaded transitively via resolveProxy) handles
      // quest creation — it never calls questGetBroker itself, so the ONLY quest lookup a
      // chaoswhisperer-new spawn triggers is chatSpawnBroker's own cwd resolution
      // immediately after, against the quest id the sticky randomUUID mock mints. Default
      // that quest to the legacy (no-worktreePath) path.
      cwdProxy.setupLegacyQuest({
        quest: QuestStub({ id: CREATED_QUEST_ID }),
        repoRoot: DEFAULT_REPO_ROOT,
      });
      // The launcher's spawn mock receives the stdout lines + exit code.
      launchProxy.setupSpawnAndEmitLines({
        lines: stdoutLines ?? [],
        exitCode,
      });
    },

    setupResumeSession: ({
      exitCode,
      stdoutLines,
      sessionId,
      questId,
    }: {
      exitCode: ExitCode;
      stdoutLines?: readonly string[];
      sessionId?: SessionId;
      questId?: QuestId;
    }): void => {
      // Seed a chaoswhisperer work item so resolveChatQuestLayerBroker's questGetBroker
      // lookup finds it. The launcher requires `questWorkItemId` for addressability. The
      // questId is matched by the find/load chain in the proxy stack — pass it through so
      // tests using their own questId values find the quest they expect.
      const chaosItem = WorkItemStub({
        role: 'chaoswhisperer',
        ...(sessionId === undefined ? {} : { sessionId }),
      });
      const quest = QuestStub({
        ...(questId === undefined ? {} : { id: questId, folder: questId }),
        workItems: [chaosItem],
      });
      // resolveChatQuestLayerBroker's resume branch requires a questId (it falls through to
      // the create branch without one, never calling questGetBroker at all) — staging this
      // quest's lookup when questId is omitted would queue dead entries on the shared
      // pathJoin/readFile mocks that a later, unrelated real call could wrongly consume.
      // The quest chatSpawnBroker's cwd resolution asks about in the create-fallback case is
      // the freshly-minted CREATED_QUEST_ID, not this method's own `quest`.
      if (questId === undefined) {
        cwdProxy.setupLegacyQuest({
          quest: QuestStub({ id: CREATED_QUEST_ID }),
          repoRoot: DEFAULT_REPO_ROOT,
        });
      } else {
        resolveProxy.setupQuestFound({ quest });
        cwdProxy.setupLegacyQuest({ quest, repoRoot: DEFAULT_REPO_ROOT });
      }
      launchProxy.setupSpawnAndEmitLines({
        lines: stdoutLines ?? [],
        exitCode,
      });
    },

    setupQuestCreationFailure: (): void => {
      // The chaoswhisperer-new path calls questUserAddBroker. Fail it so callers asserting
      // on "Failed to create quest" see the expected error from resolveChatQuestLayerBroker.
      resolveProxy.setupQuestCreationFailure({ error: new Error('Create broker rejected') });
    },

    setupGlyphsmithSession: ({
      exitCode,
      quest,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      quest: Quest;
      stdoutLines?: readonly string[];
    }): void => {
      // resolveChatQuestLayerBroker's glyph path looks up a glyphsmith work item — seed
      // one if the test stub didn't include workItems. Preserves the test's quest fields
      // (id, status) while ensuring the work item lookup succeeds.
      const hasGlyphItem = quest.workItems.some((wi) => wi.role === 'glyphsmith');
      const seededQuest = hasGlyphItem
        ? quest
        : QuestStub({
            ...quest,
            workItems: [...quest.workItems, WorkItemStub({ role: 'glyphsmith' })],
          });
      resolveProxy.setupQuestFound({ quest: seededQuest });
      cwdProxy.setupLegacyQuest({ quest: seededQuest, repoRoot: DEFAULT_REPO_ROOT });
      launchProxy.setupSpawnAndEmitLines({
        lines: stdoutLines ?? [],
        exitCode,
      });
    },

    setupQuestNotFound: (): void => {
      resolveProxy.setupQuestNotFound();
    },

    setupInvalidStatus: ({ quest }: { quest: Quest }): void => {
      resolveProxy.setupQuestFound({ quest });
    },

    setupSessionLinkQuest: ({ quest }: { quest: Quest }): void => {
      resolveProxy.setupQuestFound({ quest });
    },

    setupSessionLinkReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupStderrCapture: (): SpyOnHandle => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      // Every write must succeed regardless of content — this proxy silences + records
      // stderr wholesale, it never discriminates by what was written.
      handle.calledWith([]).returns(true);
      return handle;
    },

    setupResumeWithWorktree: ({
      questId,
      sessionId,
      worktreePath,
    }: {
      questId: QuestId;
      sessionId: SessionId;
      worktreePath: AbsoluteFilePath;
    }): void => {
      const chaosItem = WorkItemStub({ role: 'chaoswhisperer', sessionId });
      const quest = QuestStub({
        id: questId,
        folder: questId,
        workItems: [chaosItem],
        worktreePath,
      });
      resolveProxy.setupQuestFound({ quest });
      cwdProxy.setupWorktreePresent({ quest });
      launchProxy.setupSpawnAndEmitLines({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });
    },

    setupResumeWithMissingWorktree: ({
      questId,
      sessionId,
      worktreePath,
    }: {
      questId: QuestId;
      sessionId: SessionId;
      worktreePath: AbsoluteFilePath;
    }): void => {
      const chaosItem = WorkItemStub({ role: 'chaoswhisperer', sessionId });
      const quest = QuestStub({
        id: questId,
        folder: questId,
        workItems: [chaosItem],
        worktreePath,
      });
      resolveProxy.setupQuestFound({ quest });
      cwdProxy.setupWorktreeMissing({ quest });
    },

    setupResumeWithRepoRoot: ({
      questId,
      sessionId,
      repoRoot,
    }: {
      questId: QuestId;
      sessionId: SessionId;
      repoRoot: RepoRootCwd;
    }): void => {
      const chaosItem = WorkItemStub({ role: 'chaoswhisperer', sessionId });
      const quest = QuestStub({ id: questId, folder: questId, workItems: [chaosItem] });
      resolveProxy.setupQuestFound({ quest });
      cwdProxy.setupLegacyQuest({ quest, repoRoot });
      launchProxy.setupSpawnAndEmitLines({ lines: [], exitCode: ExitCodeStub({ value: 0 }) });
    },

    getSpawnedOptions: (): unknown => launchProxy.getSpawnedOptions(),

    getSpawnedArgs: (): unknown => launchProxy.getSpawnedArgs(),

    getSpawnedCwd: (): RepoRootCwd | undefined => launchProxy.getSpawnedCwd(),

    setupMainTailGuild: launchProxy.setupMainTailGuild,
    setupMainTailLines: launchProxy.setupMainTailLines,
    triggerMainTailChange: launchProxy.triggerMainTailChange,
  };
};
