import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts/directory-entry/directory-entry.stub';

import { DirectoryBrowserModalWidgetProxy } from '../directory-browser-modal/directory-browser-modal-widget.proxy';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const GuildAddModalWidgetProxy = (): {
  setupDirectoryBrowse: (params: { entries: DirectoryEntry[] }) => void;
  typeName: (params: { name: string }) => Promise<void>;
  clickBrowse: () => Promise<void>;
  clickCreate: () => Promise<void>;
  clickCancel: () => Promise<void>;
  isCreateDisabled: () => boolean;
  getPathDisplay: () => HTMLElement['textContent'];
  clickDirectoryBrowserSelect: () => Promise<void>;
  clickDirectoryBrowserCancel: () => Promise<void>;
  clickDirectoryBrowserGoUp: () => Promise<void>;
  getDirectoryBrowserCurrentPath: () => HTMLElement['textContent'];
} => {
  const directoryBrowserProxy = DirectoryBrowserModalWidgetProxy();

  return {
    setupDirectoryBrowse: ({ entries }: { entries: DirectoryEntry[] }): void => {
      directoryBrowserProxy.setupEntries({ entries });
    },
    typeName: async ({ name }: { name: string }): Promise<void> => {
      const input = screen.getByTestId('GUILD_NAME_INPUT');
      await userEvent.clear(input);
      await userEvent.type(input, name, userEventStatics.options);
    },
    clickBrowse: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('BROWSE_BUTTON'), userEventStatics.options);
    },
    clickCreate: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('CREATE_GUILD_BUTTON'), userEventStatics.options);
    },
    clickCancel: async (): Promise<void> => {
      await userEvent.click(
        screen.getByRole('button', { name: 'Cancel' }),
        userEventStatics.options,
      );
    },
    isCreateDisabled: (): boolean => {
      const button = screen.getByTestId('CREATE_GUILD_BUTTON');
      return button.hasAttribute('disabled') || button.getAttribute('data-disabled') === 'true';
    },
    getPathDisplay: (): HTMLElement['textContent'] => {
      const wrapper = screen.queryByTestId('GUILD_PATH_DISPLAY');

      if (!wrapper) return null;

      const input = wrapper.querySelector('input');

      return input?.value ?? '';
    },
    clickDirectoryBrowserSelect: async (): Promise<void> => {
      await directoryBrowserProxy.clickSelect();
    },
    clickDirectoryBrowserCancel: async (): Promise<void> => {
      await directoryBrowserProxy.clickCancel();
    },
    clickDirectoryBrowserGoUp: async (): Promise<void> => {
      await directoryBrowserProxy.clickGoUp();
    },
    getDirectoryBrowserCurrentPath: (): HTMLElement['textContent'] =>
      directoryBrowserProxy.getCurrentPath(),
  };
};
