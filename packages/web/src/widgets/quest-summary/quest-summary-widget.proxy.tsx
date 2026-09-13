import { useQuestSummaryBindingProxy } from '../../bindings/use-quest-summary/use-quest-summary-binding.proxy';
import { FlowRowLayerWidgetProxy } from './flow-row-layer-widget.proxy';
import { NoteGroupLayerWidgetProxy } from './note-group-layer-widget.proxy';
import { ObservableRowLayerWidgetProxy } from './observable-row-layer-widget.proxy';
import { UnconfirmableRowLayerWidgetProxy } from './unconfirmable-row-layer-widget.proxy';

export const QuestSummaryWidgetProxy = (): ReturnType<typeof useQuestSummaryBindingProxy> => {
  const binding = useQuestSummaryBindingProxy();
  FlowRowLayerWidgetProxy();
  ObservableRowLayerWidgetProxy();
  UnconfirmableRowLayerWidgetProxy();
  NoteGroupLayerWidgetProxy();
  return { ...binding };
};
