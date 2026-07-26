import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { clipboardWriteAdapterProxy } from '../../adapters/clipboard/write/clipboard-write-adapter.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const DumpsterCommandBannerWidgetProxy = (): {
  hasBanner: () => boolean;
  getCommandText: () => HTMLElement['textContent'];
  clickCopy: () => Promise<void>;
  setupClipboardSucceeds: (params: { text: string }) => void;
  setupClipboardThrows: (params: { text: string; error: Error }) => void;
  setupConsoleErrorCapture: () => SpyOnHandle;
  getCopiedText: () => unknown;
  getCopyButtonLabel: () => HTMLElement['textContent'];
} => {
  PixelBtnWidgetProxy();
  const clipboard = clipboardWriteAdapterProxy();

  return {
    hasBanner: (): boolean => screen.queryByTestId('DUMPSTER_COMMAND_BANNER') !== null,
    getCommandText: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('DUMPSTER_COMMAND_BANNER_COMMAND');
      return element?.textContent ?? null;
    },
    clickCopy: async (): Promise<void> => {
      const banner = screen.getByTestId('DUMPSTER_COMMAND_BANNER');
      const button = within(banner).getByTestId('PIXEL_BTN');
      await userEvent.click(button);
    },
    setupClipboardSucceeds: ({ text }: { text: string }): void => {
      clipboard.succeeds({ text });
    },
    setupClipboardThrows: ({ text, error }: { text: string; error: Error }): void => {
      clipboard.throws({ text, error });
    },
    setupConsoleErrorCapture: (): SpyOnHandle => {
      // passthrough: true — console.error is a shared sink; React's own internal warnings also
      // flow through it and must keep printing normally, not throw for being unstaged.
      const handle = registerSpyOn({
        object: globalThis.console,
        method: 'error',
        passthrough: true,
      });
      handle.calledWith(['[dumpster-command-banner] copy failed']).implement(() => undefined);
      return handle;
    },
    getCopiedText: (): unknown => clipboard.getWrittenText(),
    getCopyButtonLabel: (): HTMLElement['textContent'] => {
      const banner = screen.getByTestId('DUMPSTER_COMMAND_BANNER');
      const button = within(banner).getByTestId('PIXEL_BTN');
      return button.textContent;
    },
  };
};
