import { useQuestQueueBindingProxy } from '../../bindings/use-quest-queue/use-quest-queue-binding.proxy';
import { DispatchToggleWidgetProxy } from '../dispatch-toggle/dispatch-toggle-widget.proxy';

export const QuestQueueBarWidgetProxy = (): ReturnType<typeof useQuestQueueBindingProxy> => {
  // The banner embeds DispatchToggleWidget; enforce-proxy-child-creation requires its proxy be
  // created here. Create it BEFORE the queue binding proxy so the queue binding's WS channel proxy
  // registers last and owns the mocked socket — the WS-update tests deliver frames via the queue
  // channel, so it must win. No setup call: the toggle renders null without a dispatch state.
  DispatchToggleWidgetProxy();
  const queue = useQuestQueueBindingProxy();
  return { ...queue };
};
