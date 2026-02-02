/**
 * PURPOSE: Proxy for ListScreenLayerWidget that delegates to binding proxy for data setup
 *
 * USAGE:
 * const proxy = ListScreenLayerWidgetProxy();
 * proxy.setupQuests({ quests });
 * const { lastFrame, stdin } = render(<ListScreenLayerWidget startPath={startPath} onBack={onBack} />);
 */

import type { QuestListItem } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';
import { useQuestsListBindingProxy } from '../../bindings/use-quests-list/use-quests-list-binding.proxy';

export const ListScreenLayerWidgetProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  // Initialize child proxies for dependencies
  inkBoxAdapterProxy();
  inkTextAdapterProxy();
  inkUseInputAdapterProxy();

  const bindingProxy = useQuestsListBindingProxy();

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      bindingProxy.setupQuests({ quests });
    },
    setupError: ({ error }: { error: Error }): void => {
      bindingProxy.setupError({ error });
    },
  };
};
