/**
 * PURPOSE: Test proxy for QueuePageWidget - sets up queue entries via the quest queue binding
 * proxy and dispatch state/play/pause endpoints via the dispatch toggle widget proxy.
 *
 * USAGE:
 * const proxy = QueuePageWidgetProxy();
 * proxy.setupEntries({ entries: [QuestQueueEntryStub()] });
 * proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });
 */

import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { useQuestQueueBindingProxy } from '../../bindings/use-quest-queue/use-quest-queue-binding.proxy';
import { DispatchToggleWidgetProxy } from '../dispatch-toggle/dispatch-toggle-widget.proxy';
import { QueueRowLayerWidgetProxy } from './queue-row-layer-widget.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const QueuePageWidgetProxy = (): ReturnType<typeof useQuestQueueBindingProxy> & {
  setupDispatchState: (params: { state: DispatchState }) => void;
  setupPlayAllowed: (params: { state: DispatchState }) => void;
  setupPause: (params: { state: DispatchState }) => void;
  hasToggleLabel: (params: { text: string }) => boolean;
  getShownToast: () => unknown;
} => {
  const queue = useQuestQueueBindingProxy();
  const toggle = DispatchToggleWidgetProxy();
  // The list renders one QueueRowLayerWidget per entry; enforce-proxy-child-creation requires its
  // proxy be created here. Empty — the row has no I/O of its own to mock.
  QueueRowLayerWidgetProxy();

  return {
    ...queue,
    setupDispatchState: ({ state }: { state: DispatchState }): void => {
      toggle.setupDispatchState({ state });
    },
    setupPlayAllowed: ({ state }: { state: DispatchState }): void => {
      toggle.setupPlayAllowed({ state });
    },
    setupPause: ({ state }: { state: DispatchState }): void => {
      toggle.setupPause({ state });
    },
    hasToggleLabel: ({ text }: { text: string }): boolean => toggle.hasToggleLabel({ text }),
    getShownToast: (): unknown => toggle.getShownToast(),
  };
};
