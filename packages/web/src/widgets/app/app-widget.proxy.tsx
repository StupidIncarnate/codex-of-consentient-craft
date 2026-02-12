import type { QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { useAgentOutputBindingProxy } from '../../bindings/use-agent-output/use-agent-output-binding.proxy';
import { useExecutionBindingProxy } from '../../bindings/use-execution/use-execution-binding.proxy';
import { useQuestDetailBindingProxy } from '../../bindings/use-quest-detail/use-quest-detail-binding.proxy';
import { useQuestsBindingProxy } from '../../bindings/use-quests/use-quests-binding.proxy';
import { QuestDetailWidgetProxy } from '../quest-detail/quest-detail-widget.proxy';
import { QuestListWidgetProxy } from '../quest-list/quest-list-widget.proxy';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const AppWidgetProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsError: (params: { error: Error }) => void;
} => {
  useQuestDetailBindingProxy();
  useExecutionBindingProxy();
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
  };
};
