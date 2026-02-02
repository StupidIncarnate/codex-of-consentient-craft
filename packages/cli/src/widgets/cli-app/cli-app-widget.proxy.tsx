/**
 * PURPOSE: Proxy for CliAppWidget - minimal since real ink-testing-library is used
 *
 * USAGE:
 * CliAppWidgetProxy();
 * const { lastFrame, stdin } = render(
 *   <CliAppWidget initialScreen="menu" onExit={fn} />
 * );
 * stdin.write('\x1B[B'); // Down arrow
 * stdin.write('\r'); // Enter
 *
 * This proxy exists for API compatibility. With real ink-testing-library,
 * use stdin.write() for key simulation instead of proxy trigger methods.
 */
import { HelpScreenLayerWidgetProxy } from './help-screen-layer-widget.proxy';
import { InitScreenLayerWidgetProxy } from './init-screen-layer-widget.proxy';
import { ListScreenLayerWidgetProxy } from './list-screen-layer-widget.proxy';
import { MenuScreenLayerWidgetProxy } from './menu-screen-layer-widget.proxy';
import { RunScreenLayerWidgetProxy } from './run-screen-layer-widget.proxy';

type CliAppScreen = 'menu' | 'help' | 'list' | 'init' | 'run';

export const CliAppWidgetProxy = (): {
  setupMenuScreen: () => void;
  setupHelpScreen: () => void;
  setupListScreen: () => void;
  setupInitScreen: () => void;
  getRenderedScreen: () => CliAppScreen;
  triggerMenuSelect: ({ option }: { option: string }) => void;
  triggerMenuExit: () => void;
  triggerHelpBack: () => void;
  triggerListBack: () => void;
  triggerInitBack: () => void;
  getSetState: () => jest.Mock;
} => {
  // Initialize child proxies for layer widgets
  HelpScreenLayerWidgetProxy();
  InitScreenLayerWidgetProxy();
  ListScreenLayerWidgetProxy();
  MenuScreenLayerWidgetProxy();
  RunScreenLayerWidgetProxy();

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
    getSetState: (): jest.Mock => setState,
  };
};
