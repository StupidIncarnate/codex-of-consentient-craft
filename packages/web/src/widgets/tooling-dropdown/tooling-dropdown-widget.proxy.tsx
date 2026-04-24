import { useQuestQueueBindingProxy } from '../../bindings/use-quest-queue/use-quest-queue-binding.proxy';
import { useSmoketestRunBindingProxy } from '../../bindings/use-smoketest-run/use-smoketest-run-binding.proxy';

export const ToolingDropdownWidgetProxy = (): {
  queue: ReturnType<typeof useQuestQueueBindingProxy>;
  smoketest: ReturnType<typeof useSmoketestRunBindingProxy>;
} => ({
  queue: useQuestQueueBindingProxy(),
  smoketest: useSmoketestRunBindingProxy(),
});
