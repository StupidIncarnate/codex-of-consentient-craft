import type { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

import { useQuestQueueBindingProxy } from '../../bindings/use-quest-queue/use-quest-queue-binding.proxy';
import { DispatchToggleWidgetProxy } from '../dispatch-toggle/dispatch-toggle-widget.proxy';
import { QueueRowLayerWidgetProxy } from './queue-row-layer-widget.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const QuestQueueBarWidgetProxy = (): ReturnType<typeof useQuestQueueBindingProxy> & {
  setupDispatchState: (params: { state: DispatchState }) => void;
} => {
  // The banner embeds DispatchToggleWidget; enforce-proxy-child-creation requires its proxy be
  // created here. Create it BEFORE the queue binding proxy so the queue binding's WS channel proxy
  // registers last and owns the mocked socket — the WS-update tests deliver frames via the queue
  // channel, so it must win. The toggle fetches the dispatch state on mount, whenever the bar has
  // entries, so a test with entries stages it through `setupDispatchState`.
  const toggle = DispatchToggleWidgetProxy();
  // The expanded list renders one QueueRowLayerWidget per entry; enforce-proxy-child-creation
  // requires its proxy be created here. Empty — the row has no I/O of its own to mock.
  QueueRowLayerWidgetProxy();
  const queue = useQuestQueueBindingProxy();
  return {
    ...queue,
    setupDispatchState: ({ state }: { state: DispatchState }): void => {
      toggle.setupDispatchState({ state });
    },
  };
};
