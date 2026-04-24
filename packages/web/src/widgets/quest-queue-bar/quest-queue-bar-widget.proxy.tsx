import { useQuestQueueBindingProxy } from '../../bindings/use-quest-queue/use-quest-queue-binding.proxy';

export const QuestQueueBarWidgetProxy = (): ReturnType<typeof useQuestQueueBindingProxy> =>
  useQuestQueueBindingProxy();
