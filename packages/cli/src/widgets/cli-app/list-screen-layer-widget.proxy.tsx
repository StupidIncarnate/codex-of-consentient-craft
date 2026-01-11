/**
 * PURPOSE: Proxy for ListScreenLayerWidget that delegates to binding proxy for data setup
 *
 * USAGE:
 * const proxy = ListScreenLayerWidgetProxy();
 * proxy.setupQuests({ quests });
 * const { lastFrame, stdin } = render(<ListScreenLayerWidget startPath={startPath} onBack={onBack} />);
 */

// Required for shared package proxies - must be before imports for Jest hoisting
jest.mock('fs/promises');
jest.mock('path');
jest.mock('fs');

import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';
import { useQuestsListBindingProxy } from '../../bindings/use-quests-list/use-quests-list-binding.proxy';

export const ListScreenLayerWidgetProxy = (): {
  bindingProxy: ReturnType<typeof useQuestsListBindingProxy>;
} => {
  // Initialize child proxies for dependencies
  inkBoxAdapterProxy();
  inkTextAdapterProxy();
  inkUseInputAdapterProxy();

  const bindingProxy = useQuestsListBindingProxy();

  return {
    bindingProxy,
  };
};
