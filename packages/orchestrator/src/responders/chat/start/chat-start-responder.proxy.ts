import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';
import type { ExitCodeStub } from '@dungeonmaster/shared/contracts';

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

export const ChatStartResponderProxy = (): {
  callResponder: typeof ChatStartResponder;
  setupNewSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupResumeSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupQuestsPath: ReturnType<typeof questListBrokerProxy>['setupQuestsPath'];
  setupQuestDirectories: ReturnType<typeof questListBrokerProxy>['setupQuestDirectories'];
  setupProcessEmpty: ReturnType<typeof orchestrationProcessesStateProxy>['setupEmpty'];
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
  const spawnProxy = chatSpawnBrokerProxy();
  const questListProxy = questListBrokerProxy();
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
