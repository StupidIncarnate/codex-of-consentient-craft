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
  setupClipboardSucceeds: () => void;
  setupClipboardThrows: (params: { error: Error }) => void;
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
    setupClipboardSucceeds: (): void => {
      clipboard.succeeds();
    },
    setupClipboardThrows: ({ error }: { error: Error }): void => {
      clipboard.throws({ error });
    },
    setupConsoleErrorCapture: (): SpyOnHandle => {
      const handle = registerSpyOn({ object: globalThis.console, method: 'error' });
      handle.mockImplementation(() => undefined);
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
