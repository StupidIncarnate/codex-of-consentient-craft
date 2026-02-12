import type {
  OrchestrationStatusStub,
  ProcessIdStub,
  QuestListItemStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { useAgentOutputBindingProxy } from '../../bindings/use-agent-output/use-agent-output-binding.proxy';
import { useExecutionBindingProxy } from '../../bindings/use-execution/use-execution-binding.proxy';
import { useQuestDetailBindingProxy } from '../../bindings/use-quest-detail/use-quest-detail-binding.proxy';
import { useQuestsBindingProxy } from '../../bindings/use-quests/use-quests-binding.proxy';
import { QuestDetailWidgetProxy } from '../quest-detail/quest-detail-widget.proxy';
import { QuestListWidgetProxy } from '../quest-list/quest-list-widget.proxy';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const AppWidgetProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsError: (params: { error: Error }) => void;
  setupQuestDetail: (params: { quest: Quest }) => void;
  setupQuestDetailError: (params: { error: Error }) => void;
  setupExecutionStart: (params: { processId: ProcessId }) => void;
  setupExecutionStartError: (params: { error: Error }) => void;
  setupExecutionStatus: (params: { status: OrchestrationStatus }) => void;
  setupExecutionStatusError: (params: { error: Error }) => void;
} => {
  const questDetailProxy = useQuestDetailBindingProxy();
  const executionProxy = useExecutionBindingProxy();
  useAgentOutputBindingProxy();
  const questsProxy = useQuestsBindingProxy();
  QuestListWidgetProxy();
  QuestDetailWidgetProxy();

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      questsProxy.setupQuests({ quests });
    },
    setupQuestsError: ({ error }: { error: Error }): void => {
      questsProxy.setupError({ error });
    },
    setupQuestDetail: ({ quest }: { quest: Quest }): void => {
      questDetailProxy.setupQuest({ quest });
    },
    setupQuestDetailError: ({ error }: { error: Error }): void => {
      questDetailProxy.setupError({ error });
    },
    setupExecutionStart: ({ processId }: { processId: ProcessId }): void => {
      executionProxy.setupStart({ processId });
    },
    setupExecutionStartError: ({ error }: { error: Error }): void => {
      executionProxy.setupStartError({ error });
    },
    setupExecutionStatus: ({ status }: { status: OrchestrationStatus }): void => {
      executionProxy.setupStatus({ status });
    },
    setupExecutionStatusError: ({ error }: { error: Error }): void => {
      executionProxy.setupStatusError({ error });
    },
  };
};
