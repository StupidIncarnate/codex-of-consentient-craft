import type {
  ExitCodeStub,
  QuestId,
  QuestStub as QuestStubType,
  RepoRootCwd,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import {
  GuildStub,
  GuildIdStub,
  QuestStub,
  WorkItemStub,
  filePathContract,
  repoRootCwdContract,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { agentLaunchBrokerProxy } from '../../agent/launch/agent-launch-broker.proxy';
import { chatStreamProcessHandleBrokerProxy } from '../stream-process-handle/chat-stream-process-handle-broker.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questModifyBrokerProxy } from '../../quest/modify/quest-modify-broker.proxy';
import { resolveChatQuestLayerBrokerProxy } from './resolve-chat-quest-layer-broker.proxy';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type Quest = ReturnType<typeof QuestStubType>;

type AgentLaunchProxy = ReturnType<typeof agentLaunchBrokerProxy>;

// guildGetBroker resolves at most twice per test: once directly in chatSpawnBroker, and
// once more from the post-exit main-session tail whenever a spawn's stdout extracts a
// sessionId. Three one-shot answers leaves headroom without meaning anything beyond "more
// than the two real call sites this file exercises."
const GUILD_LOOKUP_STAGING_COUNT = 3;

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
  refreshGuildConfig: () => void;
  setupSessionLinkQuest: (params: { quest: Quest }) => void;
  setupSessionLinkReject: (params: { error: Error }) => void;
  setupStderrCapture: () => SpyOnHandle;
  setupCwdResolveSuccess: (params: { cwd: string }) => void;
  setupCwdResolveReject: (params: { error: Error }) => void;
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
  // Delegated to agentLaunchBrokerProxy so callers (e.g. chat-start-responder tests) can
  // seed the post-exit main-session-tail mocks the launcher's onComplete starts. The
  // responder no longer touches chatMainSessionTailBroker directly — the launcher owns it.
  setupMainTailGuild: AgentLaunchProxy['setupMainTailGuild'];
  setupMainTailLines: AgentLaunchProxy['setupMainTailLines'];
  triggerMainTailChange: AgentLaunchProxy['triggerMainTailChange'];
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
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
  const guildProxy = guildGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  const defaultGuildId = GuildIdStub();
  const defaultGuild = GuildStub({ id: defaultGuildId });
  // Every test in this file spawns against the same fixed default guild (refreshGuildConfig()
  // re-seeds the SAME object, never a different path), so cwdResolveBroker's only ever-called
  // address is this guild's own path — keyed once here and reused by every setup method below.
  const guildStartPath = filePathContract.parse(defaultGuild.path);

  // chat-spawn-broker walks up from the guild path to the repo root via cwdResolveBroker.
  // Default answer mirrors the guild's own path, so tests that never call
  // setupCwdResolveSuccess/Reject still see a resolved cwd matching guild.path.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });
  cwdResolveMock
    .calledWith([{ startPath: guildStartPath, kind: 'repo-root' }])
    .resolves(repoRootCwdContract.parse(String(guildStartPath)));

  registerSpyOn({ object: crypto, method: 'randomUUID' })
    .calledWith([])
    .returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  const setupGuild = (): void => {
    // Resolve guildGetBroker directly to defaultGuild instead of routing through the real
    // guildConfigReadBroker/guildConfigWriteBroker fs simulation. That simulation stages its
    // own sticky, zero-argument mock of `dungeonmasterHomeFindBroker`
    // (guild-config-read-broker.proxy.ts) — the SAME zero-arg function
    // resolveChatQuestLayerBroker's quest lookup (questFindQuestPathBroker, via the shared
    // `dungeonmasterHomeFindBrokerProxy`) expects to run for REAL, mocked only at its
    // osHomedir/pathJoin leaves. `dungeonmasterHomeFindBroker` takes no identifying argument,
    // so the two composers can't be told apart by address — whichever stages last wins for
    // EVERY caller in the test, not just its own. Bypassing the guild fs simulation here
    // sidesteps that collision entirely; see GUILD_LOOKUP_STAGING_COUNT for why this stages
    // more than once.
    Array.from({ length: GUILD_LOOKUP_STAGING_COUNT }).forEach(() => {
      guildProxy.setupDirectGuild({ guild: defaultGuild });
    });
  };

  setupGuild();

  return {
    setupNewSession: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: readonly string[];
    }): void => {
      // questUserAddBroker default mock (loaded transitively via resolveProxy) handles
      // quest creation. The launcher's spawn mock receives the stdout lines + exit code.
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
      resolveProxy.setupQuestFound({
        quest: QuestStub({
          ...(questId === undefined ? {} : { id: questId, folder: questId }),
          workItems: [chaosItem],
        }),
      });
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

    refreshGuildConfig: (): void => {
      setupGuild();
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

    setupCwdResolveSuccess: ({ cwd }: { cwd: string }): void => {
      cwdResolveMock
        .calledWith([{ startPath: guildStartPath, kind: 'repo-root' }])
        .resolves(repoRootCwdContract.parse(cwd));
    },

    setupCwdResolveReject: ({ error }: { error: Error }): void => {
      cwdResolveMock.calledWith([{ startPath: guildStartPath, kind: 'repo-root' }]).throws(error);
    },

    getSpawnedOptions: (): unknown => launchProxy.getSpawnedOptions(),

    getSpawnedCwd: (): RepoRootCwd | undefined => launchProxy.getSpawnedCwd(),

    setupMainTailGuild: launchProxy.setupMainTailGuild,
    setupMainTailLines: launchProxy.setupMainTailLines,
    triggerMainTailChange: launchProxy.triggerMainTailChange,
  };
};
