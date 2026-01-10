/**
 * PURPOSE: Proxy for MenuScreenLayerWidget - minimal since real ink-testing-library is used
 *
 * USAGE:
 * MenuScreenLayerWidgetProxy();
 * const { lastFrame, stdin } = render(<MenuScreenLayerWidget onSelect={onSelect} onExit={onExit} />);
 * stdin.write('\x1B[B'); // Down arrow
 * stdin.write('\r'); // Enter
 *
 * This proxy exists for API compatibility. With real ink-testing-library,
 * use stdin.write() for key simulation instead of proxy trigger methods.
 */
import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';

export const MenuScreenLayerWidgetProxy = (): {
  triggerUpArrow: () => void;
  triggerDownArrow: () => void;
  triggerEnter: () => void;
  triggerExit: () => void;
  getSetState: () => jest.Mock;
} => {
  // Initialize child proxies for dependencies (now no-ops with real ink)
  inkBoxAdapterProxy();
  inkTextAdapterProxy();
  inkUseInputAdapterProxy();

  const setState = jest.fn();

  // With real ink-testing-library, use stdin.write() instead of these triggers
  // These methods are kept for API compatibility but are no longer needed
  return {
    triggerUpArrow: (): void => {
      // Use stdin.write('\x1B[A') instead with real ink-testing-library
    },
    triggerDownArrow: (): void => {
      // Use stdin.write('\x1B[B') instead with real ink-testing-library
    },
    triggerEnter: (): void => {
      // Use stdin.write('\r') instead with real ink-testing-library
    },
    triggerExit: (): void => {
      // Use stdin.write('q') instead with real ink-testing-library
    },
    getSetState: (): jest.Mock => setState,
  };
};
