/**
 * PURPOSE: Proxy for HelpScreenLayerWidget - minimal since real ink-testing-library is used
 *
 * USAGE:
 * HelpScreenLayerWidgetProxy();
 * const { lastFrame, stdin } = render(<HelpScreenLayerWidget onBack={onBack} />);
 * stdin.write('\x1B'); // Escape
 *
 * This proxy exists for API compatibility. With real ink-testing-library,
 * use stdin.write() for key simulation instead of proxy trigger methods.
 */

import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';

export const HelpScreenLayerWidgetProxy = (): {
  triggerEscape: () => void;
  triggerKeyQ: () => void;
  triggerOtherKey: () => void;
} => {
  // Initialize child proxies for dependencies (now no-ops with real ink)
  inkBoxAdapterProxy();
  inkTextAdapterProxy();
  inkUseInputAdapterProxy();

  // With real ink-testing-library, use stdin.write() instead of these triggers
  // These methods are kept for API compatibility but are no longer needed
  return {
    triggerEscape: (): void => {
      // Use stdin.write('\x1B') instead with real ink-testing-library
    },
    triggerKeyQ: (): void => {
      // Use stdin.write('q') instead with real ink-testing-library
    },
    triggerOtherKey: (): void => {
      // Use stdin.write('x') instead with real ink-testing-library
    },
  };
};
