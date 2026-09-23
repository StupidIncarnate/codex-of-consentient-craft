import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { useQuestSummaryBindingProxy } from '../../bindings/use-quest-summary/use-quest-summary-binding.proxy';
import { DebtRowLayerWidgetProxy } from './debt-row-layer-widget.proxy';
import { FlowRowLayerWidgetProxy } from './flow-row-layer-widget.proxy';
import { HumanCheckPanelLayerWidgetProxy } from './human-check-panel-layer-widget.proxy';
import { NoteGroupLayerWidgetProxy } from './note-group-layer-widget.proxy';
import { ObservableRowLayerWidgetProxy } from './observable-row-layer-widget.proxy';

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
  // test can read for it. passthrough: true — console.error is a shared sink and the binding proxy
  // stages its own address on it.
  const consoleSpy = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });

  return {
    ...binding,
    hasDuplicateRowKeyWarning: (): boolean =>
      consoleSpy.callsMatching([
        (message: unknown): boolean =>
          typeof message === 'string' && message.includes(DUPLICATE_KEY_WARNING),
      ]).length > 0,
  };
};
