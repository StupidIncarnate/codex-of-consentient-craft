/**
 * PURPOSE: Proxy for CliAppWidget - minimal since real ink-testing-library is used
 *
 * USAGE:
 * CliAppWidgetProxy();
 * const { lastFrame, stdin } = render(
 *   <CliAppWidget initialScreen="menu" onSpawnChaoswhisperer={fn} onExit={fn} />
 * );
 * stdin.write('\x1B[B'); // Down arrow
 * stdin.write('\r'); // Enter
 *
 * This proxy exists for API compatibility. With real ink-testing-library,
 * use stdin.write() for key simulation instead of proxy trigger methods.
 */
import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';

type CliAppScreen = 'menu' | 'add' | 'help' | 'list' | 'init';

export const CliAppWidgetProxy = (): {
  setupMenuScreen: () => void;
  setupHelpScreen: () => void;
  setupListScreen: () => void;
  setupInitScreen: () => void;
  setupAddScreen: () => void;
  getRenderedScreen: () => CliAppScreen;
  triggerMenuSelect: ({ option }: { option: string }) => void;
  triggerMenuExit: () => void;
  triggerHelpBack: () => void;
  triggerListBack: () => void;
  triggerInitBack: () => void;
  triggerTextInputSubmit: ({ userInput }: { userInput: string }) => void;
  triggerTextInputCancel: () => void;
  getSetState: () => jest.Mock;
} => {
  // Initialize child proxies for dependencies (now no-ops with real ink)
  inkBoxAdapterProxy();
  inkTextAdapterProxy();
  inkUseInputAdapterProxy();

  const setState = jest.fn();
  const screenState = { current: 'menu' as CliAppScreen };

  // With real ink-testing-library, use stdin.write() and render() instead of these methods
  // These are kept for API compatibility but are no longer needed
  return {
    setupMenuScreen: (): void => {
      screenState.current = 'menu';
    },
    setupHelpScreen: (): void => {
      screenState.current = 'help';
    },
    setupListScreen: (): void => {
      screenState.current = 'list';
    },
    setupInitScreen: (): void => {
      screenState.current = 'init';
    },
    setupAddScreen: (): void => {
      screenState.current = 'add';
    },
    getRenderedScreen: (): CliAppScreen => screenState.current,
    triggerMenuSelect: ({ option }: { option: string }): void => {
      screenState.current = option as CliAppScreen;
    },
    triggerMenuExit: (): void => {
      // Use stdin.write('q') instead with real ink-testing-library
    },
    triggerHelpBack: (): void => {
      screenState.current = 'menu';
    },
    triggerListBack: (): void => {
      screenState.current = 'menu';
    },
    triggerInitBack: (): void => {
      screenState.current = 'menu';
    },
    triggerTextInputSubmit: ({ userInput: _userInput }: { userInput: string }): void => {
      // Use stdin.write(text) then stdin.write('\r') instead
    },
    triggerTextInputCancel: (): void => {
      screenState.current = 'menu';
    },
    getSetState: (): jest.Mock => setState,
  };
};
