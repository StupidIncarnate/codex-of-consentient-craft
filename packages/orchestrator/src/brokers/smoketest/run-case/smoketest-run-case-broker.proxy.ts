import { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { questHydrateBrokerProxy } from '../../quest/hydrate/quest-hydrate-broker.proxy';
import { smoketestAssertFinalStateBrokerProxy } from '../assert-final-state/smoketest-assert-final-state-broker.proxy';
import { smoketestPollQuestUntilTerminalBrokerProxy } from '../poll-quest-until-terminal/smoketest-poll-quest-until-terminal-broker.proxy';
import { smoketestRunTeardownChecksBrokerProxy } from '../run-teardown-checks/smoketest-run-teardown-checks-broker.proxy';
import { smoketestScenarioDriverBrokerProxy } from '../scenario-driver/smoketest-scenario-driver-broker.proxy';
import { smoketestTeardownQuestBrokerProxy } from '../teardown-quest/smoketest-teardown-quest-broker.proxy';
import { buildCaseResultLayerBrokerProxy } from './build-case-result-layer-broker.proxy';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

export const smoketestRunCaseBrokerProxy = (): {
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  emitQuestModified: (payload: { questId?: unknown }) => void;
  isHandlerSubscribed: () => boolean;
  startQuest: (params: { questId: QuestId }) => Promise<ProcessId>;
  getStartQuestCalls: () => readonly { questId: QuestId }[];
  setupStartQuestThrows: (params: { error: Error }) => void;
} => {
  questHydrateBrokerProxy();
  smoketestAssertFinalStateBrokerProxy();
  smoketestPollQuestUntilTerminalBrokerProxy();
  smoketestRunTeardownChecksBrokerProxy();
  smoketestScenarioDriverBrokerProxy();
  smoketestTeardownQuestBrokerProxy();
  buildCaseResultLayerBrokerProxy();

  const handlers: QuestModifiedHandler[] = [];
  const startQuestCalls: { questId: QuestId }[] = [];
  const startQuestError: { value: Error | null } = { value: null };

  return {
    subscribe: (handler: QuestModifiedHandler): void => {
      handlers.push(handler);
    },
    unsubscribe: (handler: QuestModifiedHandler): void => {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    },
    emitQuestModified: (payload: { questId?: unknown }): void => {
      const snapshot = handlers.slice();
      const emittedProcessId = ProcessIdStub({ value: 'orch-case-proxy-emitted' });
      for (const h of snapshot) {
        h({ processId: emittedProcessId, payload });
      }
    },
    isHandlerSubscribed: (): boolean => handlers.length > 0,
    startQuest: async ({ questId }: { questId: QuestId }): Promise<ProcessId> => {
      startQuestCalls.push({ questId });
      if (startQuestError.value !== null) {
        return Promise.reject(startQuestError.value);
      }
      return Promise.resolve(ProcessIdStub({ value: 'orch-case-proxy-start' }));
    },
    getStartQuestCalls: (): readonly { questId: QuestId }[] => startQuestCalls.slice(),
    setupStartQuestThrows: ({ error }: { error: Error }): void => {
      startQuestError.value = error;
    },
  };
};
