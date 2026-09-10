import { homedir } from 'os';
import { join } from 'path';
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
import {
  locationsQuestFolderPathFindBrokerProxy,
  locationsQuestImagesPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { agentLaunchBrokerProxy } from '../../agent/launch/agent-launch-broker.proxy';
import { chatStreamProcessHandleBrokerProxy } from '../stream-process-handle/chat-stream-process-handle-broker.proxy';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questModifyBrokerProxy } from '../../quest/modify/quest-modify-broker.proxy';
import { questSessionRecordBroker } from '../../quest/session-record/quest-session-record-broker';
import { questSessionRecordBrokerProxy } from '../../quest/session-record/quest-session-record-broker.proxy';
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

// chatSpawnBroker's `--add-dir` grant (chat-spawn-broker.ts) resolves the quest's images
// directory through the real locations chain (locationsGuildPathFindBroker ->
// locationsGuildQuestsPathFindBroker -> locationsQuestFolderPathFindBroker ->
// locationsQuestImagesPathFindBroker), which makes FIVE real `path.join` calls (homePath,
// guildPath, guildQuestsPath, questFolderPath, imagesDirPath) right after cwd resolution
// completes, on EVERY chatSpawnBroker call, plus one `os.homedir()` call.
//
// None of the five joins is safe to content-address. A content match keyed on a locationsStatics
// literal ('guilds'/'quests'/'images') looks selective, but registerMock's argument matching is a
// PREFIX match — a 3-element address `[any, 'guilds', any]` also matches a 4-argument call like
// questResolveQuestsPathBroker's own `join(homePath, 'guilds', guildId, 'quests')` (used by
// questListBroker's guild-quests-dir scan). A content match wins over any competing onceFor([])
// address regardless of registration order, so it silently steals that unrelated call away from
// questResolveQuestsPathBrokerProxy's own staged one-shot — stranding that one-shot to answer
// whatever unaddressed call comes next instead, corrupting a sibling cycle. (Measured: this broke
// every chat-start-responder.test.ts scenario that stages questListBrokerProxy alongside this
// proxy.) So all five joins are staged as plain ORDER-SCOPED one-shots, real-passthrough,
// positioned by this call site landing exactly where the five calls fire in execution order:
// right after this broker's own cwd-resolution staging, before the spawn adapter's own emit.
//
// os.homedir() takes no arguments, so every caller shares the address []. STICKY (not one-shot)
// because two SEPARATE real computations must agree on it within one test: chatSpawnBroker's own
// internal add-dir computation, and a test that separately re-computes the same locations chain to
// build its expected value (chat-spawn-broker.test.ts's own --add-dir boundary test calls
// locationsQuestFolderPathFindBroker/locationsQuestImagesPathFindBroker directly, AFTER
// chatSpawnBroker has already run, and compares the two results). A live one-shot queued earlier
// by another proxy still wins over this sticky default, so it cannot steal from anyone.
const stageAddDirPathJoins = (): void => {
  const realPathJoin = requireActual<{ join: typeof join }>({ module: 'path' });
  const pathJoinHandle = registerMock({ fn: join });

  pathJoinHandle.onceFor([]).implement((...segments: never[]) => realPathJoin.join(...segments));
  pathJoinHandle.onceFor([]).implement((...segments: never[]) => realPathJoin.join(...segments));
  pathJoinHandle.onceFor([]).implement((...segments: never[]) => realPathJoin.join(...segments));
  pathJoinHandle.onceFor([]).implement((...segments: never[]) => realPathJoin.join(...segments));
  pathJoinHandle.onceFor([]).implement((...segments: never[]) => realPathJoin.join(...segments));

  registerMock({ fn: homedir }).calledWith([]).returns('/home/testuser');
};

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
  setupMainTailHomeDir: AgentLaunchProxy['setupMainTailHomeDir'];
  setupMainTailLines: AgentLaunchProxy['setupMainTailLines'];
  triggerMainTailChange: AgentLaunchProxy['triggerMainTailChange'];
  // Exposed for composing proxies (e.g. FollowupChatStartResponderProxy) that drive
  // chatSpawnBroker's own quest resolution directly via resolveChatQuestLayerBrokerProxy /
  // questCwdResolveBrokerProxy rather than through setupNewSession/setupResumeSession/
  // setupGlyphsmithSession — those three call this internally at the right point already;
  // this lets a caller with its own resolution sequence stage the add-dir absorbers at the
  // exact point its OWN cwd-resolution cycle finishes, without duplicating the mocking logic.
  stageAddDirPathJoins: () => void;
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
  // locationsQuestFolderPathFindBroker/locationsQuestImagesPathFindBroker are imported by
  // chat-spawn-broker.ts for its `--add-dir` computation; these calls satisfy
  // enforce-proxy-child-creation, which tracks the import edge. The actual mocking for that
  // computation is hand-rolled in stageAddDirPathJoins above (registerMock on the raw
  // path.join/os.homedir, not on these brokers), so these are registration-only.
  locationsQuestFolderPathFindBrokerProxy();
  locationsQuestImagesPathFindBrokerProxy();
  // The session-cwd row rides the same per-quest lock and quest-file walk as the ledger writes and
  // has its own suite, so it is mocked at the module boundary rather than staged through the quest
  // file proxies. This call satisfies enforce-proxy-child-creation, which tracks the import edge.
  questSessionRecordBrokerProxy();
  // Fire-and-forget from a callback: the sessionId comes from the child's own init line, so there
  // is no per-test address to key on and the row's content is asserted by that broker's own suite.
  // An unstaged call would throw INSIDE the spawn's `.catch`, adding a stderr line that tests
  // asserting on stderr would then have to account for.
  registerMock({ fn: questSessionRecordBroker })
    .calledWith([])
    .resolves({ success: true as const });

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
      stageAddDirPathJoins(); // chatSpawnBroker's own `--add-dir` computation — see header comment
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
      stageAddDirPathJoins(); // chatSpawnBroker's own `--add-dir` computation — see header comment
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
      stageAddDirPathJoins(); // chatSpawnBroker's own `--add-dir` computation — see header comment
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

    setupMainTailHomeDir: launchProxy.setupMainTailHomeDir,
    setupMainTailLines: launchProxy.setupMainTailLines,
    triggerMainTailChange: launchProxy.triggerMainTailChange,

    stageAddDirPathJoins,
  };
};
