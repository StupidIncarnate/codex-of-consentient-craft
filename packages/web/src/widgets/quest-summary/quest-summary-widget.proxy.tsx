import { useQuestSummaryBindingProxy } from '../../bindings/use-quest-summary/use-quest-summary-binding.proxy';

export const QuestSummaryWidgetProxy = (): ReturnType<typeof useQuestSummaryBindingProxy> => {
  const binding = useQuestSummaryBindingProxy();
  return { ...binding };
};
