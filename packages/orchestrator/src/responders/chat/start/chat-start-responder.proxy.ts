import type {
  GetQuestResult,
  OrchestrationEventType,
  ProcessId,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { getQuestResultContract } from '@dungeonmaster/shared/contracts';
import type { ExitCodeStub, GuildConfigStub } from '@dungeonmaster/shared/contracts';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { chatMainSessionTailBrokerProxy } from '../../../brokers/chat/main-session-tail/chat-main-session-tail-broker.proxy';
import { chatSpawnBrokerProxy } from '../../../brokers/chat/spawn/chat-spawn-broker.proxy';
import { chatSubagentTailBrokerProxy } from '../../../brokers/chat/subagent-tail/chat-subagent-tail-broker.proxy';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { pendingClarificationStateProxy } from '../../../state/pending-clarification/pending-clarification-state.proxy';
import { ChatStartResponder } from './chat-start-responder';

registerModuleMock({ module: '../../../brokers/quest/get/quest-get-broker' });

type GuildConfig = ReturnType<typeof GuildConfigStub>;

type ExitCode = ReturnType<typeof ExitCodeStub>;

type Quest = ReturnType<typeof QuestStub>;

const EVENT_TYPES: readonly OrchestrationEventType[] = [
  'chat-output',
  'chat-complete',
  'chat-session-started',
  'quest-session-linked',
  'clarification-request',
] as const;

export const ChatStartResponderProxy = ({
  questSetup,
}: {
  questSetup?: {
    homeDir: Parameters<ReturnType<typeof questListBrokerProxy>['setupQuestsPath']>[0]['homeDir'];
    homePath: FilePath;
    questsPath: FilePath;
    questFiles: FileName[];
    questFilePath: FilePath;
    questJson: Parameters<
      ReturnType<typeof questListBrokerProxy>['setupQuestFile']
    >[0]['questJson'];
  };
} = {}): {
  callResponder: typeof ChatStartResponder;
  setupNewSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupResumeSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupQuestsPath: ReturnType<typeof questListBrokerProxy>['setupQuestsPath'];
  setupQuestDirectories: ReturnType<typeof questListBrokerProxy>['setupQuestDirectories'];
  setupProcessEmpty: ReturnType<typeof orchestrationProcessesStateProxy>['setupEmpty'];
  setupProcessWithKill: ReturnType<
    typeof orchestrationProcessesStateProxy
  >['setupWithProcessAndKill'];
  setupPendingEmpty: ReturnType<typeof pendingClarificationStateProxy>['setupEmpty'];
  setupPendingWithSessionEntry: ReturnType<
    typeof pendingClarificationStateProxy
  >['setupWithSessionEntry'];
  setupEventCapture: () => {
    getEmittedEvents: () => readonly {
      type: OrchestrationEventType;
      processId: ProcessId;
      payload: Record<PropertyKey, unknown>;
    }[];
  };
  setupMainTailGuild: (params: { config: GuildConfig; homeDir: string }) => void;
  setupMainTailLines: (params: { lines: readonly string[] }) => void;
  triggerMainTailChange: () => void;
  setupQuestGetImmediate: (params: { quest: Quest }) => void;
  setupQuestGetDeferred: (params: { quest: Quest }) => { resolve: () => void };
} => {
  // Quest list proxy MUST be created first and set up with quest mocks
  // BEFORE chatSpawnBrokerProxy, because both use shared sequential mock
  // queues (pathJoin, homedir, readFile) and quest resolution runs first
  // at runtime.
  const questListProxy = questListBrokerProxy();

  if (questSetup) {
    const { homeDir, homePath, questsPath, questFiles, questFilePath, questJson } = questSetup;
    questListProxy.setupQuestsPath({ homeDir, homePath, questsPath });
    questListProxy.setupQuestDirectories({ files: questFiles });
    questListProxy.setupQuestFilePath({ result: questFilePath });
    questListProxy.setupQuestFile({ questJson });
  }

  const spawnProxy = chatSpawnBrokerProxy();
  // The responder calls questGetBroker directly to look up the chaoswhisperer work item
  // after onQuestCreated fires. chatSpawnBrokerProxy also wires its own questGetBrokerProxy
  // for its internal lookups; instantiating here satisfies enforce-proxy-child-creation,
  // and re-instantiation is safe because each proxy() call re-registers idempotent mocks.
  questGetBrokerProxy();

  // questGetBroker is module-mocked at the top so tests can drive the lookup that resolves
  // chatWorkItemId (chaoswhisperer work-item lookup after onQuestCreated). Default impl
  // is the real broker (via requireActual) so tests that don't opt in keep the file-mock
  // path their existing setup expects.
  const questGetMock = questGetBroker as jest.MockedFunction<typeof questGetBroker>;
  const realQuestGetMod = requireActual<{ questGetBroker: typeof questGetBroker }>({
    module: '../../../brokers/quest/get/quest-get-broker',
  });
  questGetMock.mockImplementation(realQuestGetMod.questGetBroker);

  const processStateProxy = orchestrationProcessesStateProxy();
  const pendingProxy = pendingClarificationStateProxy();
  orchestrationEventsStateProxy();
  chatSubagentTailBrokerProxy();
  const mainTailProxy = chatMainSessionTailBrokerProxy();

  return {
    callResponder: ChatStartResponder,
    setupNewSession: ({ exitCode, stdoutLines }): void => {
      spawnProxy.setupNewSession({ exitCode, ...(stdoutLines && { stdoutLines }) });
    },
    setupResumeSession: ({ exitCode, stdoutLines }): void => {
      spawnProxy.setupResumeSession({ exitCode, ...(stdoutLines && { stdoutLines }) });
    },
    setupQuestsPath: questListProxy.setupQuestsPath,
    setupQuestDirectories: questListProxy.setupQuestDirectories,
    setupProcessEmpty: processStateProxy.setupEmpty,
    setupProcessWithKill: processStateProxy.setupWithProcessAndKill,
    setupPendingEmpty: pendingProxy.setupEmpty,
    setupPendingWithSessionEntry: pendingProxy.setupWithSessionEntry,
    setupEventCapture: () => {
      const emittedEvents: {
        type: OrchestrationEventType;
        processId: ProcessId;
        payload: Record<PropertyKey, unknown>;
      }[] = [];

      for (const eventType of EVENT_TYPES) {
        orchestrationEventsState.on({
          type: eventType,
          handler: ({ processId, payload }) => {
            emittedEvents.push({ type: eventType, processId, payload });
          },
        });
      }

      return { getEmittedEvents: () => emittedEvents };
    },
    setupMainTailGuild: ({ config, homeDir }: { config: GuildConfig; homeDir: string }): void => {
      mainTailProxy.setupGuild({ config, homeDir });
    },
    setupMainTailLines: ({ lines }: { lines: readonly string[] }): void => {
      mainTailProxy.setupLines({ lines });
    },
    triggerMainTailChange: (): void => {
      mainTailProxy.triggerChange();
    },
    // Resolve questGetBroker immediately with the supplied quest. Use when the test wants
    // chatWorkItemId to be set BEFORE any chat-output emits arrive (no buffering race).
    setupQuestGetImmediate: ({ quest }: { quest: Quest }): void => {
      questGetMock.mockResolvedValue(getQuestResultContract.parse({ success: true, quest }));
    },
    // Return a quest lookup that stays unresolved until the test calls `resolve()`.
    // Use to exercise the buffer-flush path: chat-output emits arrive while
    // chatWorkItemId is still null, then the test resolves the lookup and asserts the
    // buffered emits flush in order with questId+workItemId stamped.
    setupQuestGetDeferred: ({ quest }: { quest: Quest }): { resolve: () => void } => {
      const noopResolver: (value: GetQuestResult) => void = (_value) => {
        // Placeholder before the Promise executor runs and overwrites it. Never invoked
        // in practice — `new Promise()` synchronously assigns the real resolver below.
      };
      const resolveRef: { current: (value: GetQuestResult) => void } = { current: noopResolver };
      const pending = new Promise<GetQuestResult>((res) => {
        resolveRef.current = res;
      });
      questGetMock.mockReturnValue(pending);
      return {
        resolve: (): void => {
          resolveRef.current(getQuestResultContract.parse({ success: true, quest }));
        },
      };
    },
  };
};
