import type {
  ExitCodeStub,
  QuestId,
  QuestStub as QuestStubType,
  RepoRootCwd,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import {
  GuildConfigStub,
  GuildStub,
  GuildIdStub,
  QuestStub,
  WorkItemStub,
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

  // chat-spawn-broker walks up from the guild path to the repo root via cwdResolveBroker.
  // Stub it directly so tests don't need to seed fs.access expectations for the walk-up.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });
  cwdResolveMock.mockResolvedValue(repoRootCwdContract.parse('/home/user/my-guild'));

  registerSpyOn({ object: crypto, method: 'randomUUID' }).mockReturnValue(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  );

  const defaultGuildId = GuildIdStub();
  const defaultGuild = GuildStub({ id: defaultGuildId });

  const setupGuild = (): void => {
    guildProxy.setupConfig({ config: GuildConfigStub({ guilds: [defaultGuild] }) });
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
      handle.mockImplementation(() => true);
      return handle;
    },

    setupCwdResolveSuccess: ({ cwd }: { cwd: string }): void => {
      cwdResolveMock.mockResolvedValue(repoRootCwdContract.parse(cwd));
    },

    setupCwdResolveReject: ({ error }: { error: Error }): void => {
      cwdResolveMock.mockImplementation(() => {
        throw error;
      });
    },

    getSpawnedOptions: (): unknown => undefined,

    getSpawnedCwd: (): RepoRootCwd | undefined => launchProxy.getSpawnedCwd(),

    setupMainTailGuild: launchProxy.setupMainTailGuild,
    setupMainTailLines: launchProxy.setupMainTailLines,
    triggerMainTailChange: launchProxy.triggerMainTailChange,
  };
};
