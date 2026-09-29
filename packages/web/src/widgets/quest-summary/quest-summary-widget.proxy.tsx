import { consoleErrorProxy } from '#gateway/browser/console/console-error/console-error.proxy';

import { useQuestSummaryBindingProxy } from '../../bindings/use-quest-summary/use-quest-summary-binding.proxy';
import { DebtRowLayerWidgetProxy } from './debt-row-layer-widget.proxy';
import { FlowRowLayerWidgetProxy } from './flow-row-layer-widget.proxy';
import { HumanCheckPanelLayerWidgetProxy } from './human-check-panel-layer-widget.proxy';
import { NoteGroupLayerWidgetProxy } from './note-group-layer-widget.proxy';
import { ObservableRowLayerWidgetProxy } from './observable-row-layer-widget.proxy';

// Aliased: the widget itself never logs; React's duplicate-key warning is what this proxy reads.
const recordConsoleErrors = consoleErrorProxy;

const DUPLICATE_KEY_WARNING = 'Encountered two children with the same key';

export const QuestSummaryWidgetProxy = (): ReturnType<typeof useQuestSummaryBindingProxy> & {
  hasDuplicateRowKeyWarning: () => boolean;
} => {
  const binding = useQuestSummaryBindingProxy();
  FlowRowLayerWidgetProxy();
  ObservableRowLayerWidgetProxy();
  DebtRowLayerWidgetProxy();
  HumanCheckPanelLayerWidgetProxy();
  NoteGroupLayerWidgetProxy();
  // A list key never reaches the DOM, so React's own duplicate-key warning is the only signal a
  // test can read for it.
  const consoleProxy = recordConsoleErrors();

  return {
    ...binding,
    hasDuplicateRowKeyWarning: (): boolean =>
      consoleProxy.getCallsFor({
        message: (message: unknown): boolean =>
          typeof message === 'string' && message.includes(DUPLICATE_KEY_WARNING),
      }).length > 0,
  };
};
