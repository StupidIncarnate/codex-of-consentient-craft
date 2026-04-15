import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';
import type { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';

import { chatSpawnBrokerProxy } from '../../../brokers/chat/spawn/chat-spawn-broker.proxy';
import { chatSubagentTailBrokerProxy } from '../../../brokers/chat/subagent-tail/chat-subagent-tail-broker.proxy';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { pendingClarificationStateProxy } from '../../../state/pending-clarification/pending-clarification-state.proxy';
import { ChatStartResponder } from './chat-start-responder';

type ExitCode = ReturnType<typeof ExitCodeStub>;

const EVENT_TYPES: readonly OrchestrationEventType[] = [
  'chat-output',
  'chat-patch',
  'chat-complete',
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
  const processStateProxy = orchestrationProcessesStateProxy();
  const pendingProxy = pendingClarificationStateProxy();
  orchestrationEventsStateProxy();
  chatSubagentTailBrokerProxy();

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
  };
};
