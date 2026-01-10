/**
 * PURPOSE: Proxy for AddScreenLayerWidget - minimal since real ink-testing-library is used
 *
 * USAGE:
 * AddScreenLayerWidgetProxy();
 * const { lastFrame, stdin } = render(<AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />);
 * stdin.write('Build a REST API');
 * stdin.write('\r'); // Enter
 *
 * This proxy exists for API compatibility. With real ink-testing-library,
 * use stdin.write() for key simulation instead of proxy trigger methods.
 */
import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';

export const AddScreenLayerWidgetProxy = (): {
  triggerEscape: () => void;
  triggerEnter: () => void;
  triggerBackspace: () => void;
  triggerCharInput: ({ char }: { char: string }) => void;
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
    triggerEscape: (): void => {
      // Use stdin.write('\x1B') instead with real ink-testing-library
    },
    triggerEnter: (): void => {
      // Use stdin.write('\r') instead with real ink-testing-library
    },
    triggerBackspace: (): void => {
      // Use stdin.write('\x08') for ctrl+H or stdin.write('\x7F') for DEL key
      // Both work since implementation handles key.backspace || key.delete
    },
    triggerCharInput: ({ char: _char }: { char: string }): void => {
      // Use stdin.write(char) instead with real ink-testing-library
    },
    getSetState: (): jest.Mock => setState,
  };
};
