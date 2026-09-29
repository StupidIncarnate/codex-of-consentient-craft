import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';

import { DirectoryBrowserModalWidgetProxy } from '../directory-browser-modal/directory-browser-modal-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const GuildEmptyStateWidgetProxy = (): {
  typeGuildName: ({ value }: { value: string }) => Promise<void>;
  typeGuildPath: ({ value }: { value: string }) => Promise<void>;
  getGuildPathValue: () => HTMLElement['textContent'];
  clickBrowse: () => Promise<void>;
  clickCreate: () => Promise<void>;
  clickCancel: () => Promise<void>;
  setupDirectoryBrowse: (params: { entries: DirectoryEntry[] }) => void;
  clickDirectorySelect: () => Promise<void>;
  isNewGuildTitleVisible: () => boolean;
  isCancelVisible: () => boolean;
  isBrowseVisible: () => boolean;
} => {
  PixelBtnWidgetProxy();
  const directoryBrowser = DirectoryBrowserModalWidgetProxy();

  return {
    typeGuildName: async ({ value }: { value: string }): Promise<void> => {
      await userEvent.type(screen.getByTestId('GUILD_NAME_INPUT'), value, userEventStatics.options);
    },
    typeGuildPath: async ({ value }: { value: string }): Promise<void> => {
      await userEvent.type(screen.getByTestId('GUILD_PATH_INPUT'), value, userEventStatics.options);
    },
    getGuildPathValue: (): HTMLElement['textContent'] => {
      const wrapper = screen.getByTestId('GUILD_PATH_INPUT');
      const input = wrapper.querySelector('input');

      return input?.value ?? '';
    },
    clickBrowse: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('GUILD_BROWSE_BUTTON'), userEventStatics.options);
    },
    clickCreate: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('GUILD_CREATE_BUTTON'), userEventStatics.options);
    },
    clickCancel: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('GUILD_CANCEL_BUTTON'), userEventStatics.options);
    },
    setupDirectoryBrowse: ({ entries }: { entries: DirectoryEntry[] }): void => {
      directoryBrowser.setupEntries({ entries });
    },
    clickDirectorySelect: async (): Promise<void> => {
      await directoryBrowser.clickSelect();
    },
    isNewGuildTitleVisible: (): boolean => screen.queryByText('NEW GUILD') !== null,
    isCancelVisible: (): boolean => screen.queryByTestId('GUILD_CANCEL_BUTTON') !== null,
    isBrowseVisible: (): boolean => screen.queryByTestId('GUILD_BROWSE_BUTTON') !== null,
  };
};
