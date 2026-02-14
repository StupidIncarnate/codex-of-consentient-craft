import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DirectoryBrowserModalWidgetProxy } from '../directory-browser-modal/directory-browser-modal-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const ProjectEmptyStateWidgetProxy = (): {
  typeGuildName: ({ value }: { value: string }) => Promise<void>;
  getGuildPathValue: () => HTMLElement['textContent'];
  clickBrowse: () => Promise<void>;
  clickCreate: () => Promise<void>;
  clickCancel: () => Promise<void>;
  isNewGuildTitleVisible: () => boolean;
  isCancelVisible: () => boolean;
  isBrowseVisible: () => boolean;
} => {
  PixelBtnWidgetProxy();
  DirectoryBrowserModalWidgetProxy();

  return {
    typeGuildName: async ({ value }: { value: string }): Promise<void> => {
      await userEvent.type(screen.getByTestId('GUILD_NAME_INPUT'), value);
    },
    getGuildPathValue: (): HTMLElement['textContent'] => {
      const wrapper = screen.getByTestId('GUILD_PATH_INPUT');
      const input = wrapper.querySelector('input');

      return input?.value ?? '';
    },
    clickBrowse: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const browseBtn = buttons.find((btn) => btn.textContent === 'BROWSE');
      if (!browseBtn) {
        throw new Error('BROWSE button not found');
      }
      await userEvent.click(browseBtn);
    },
    clickCreate: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const createBtn = buttons.find((btn) => btn.textContent === 'CREATE');
      if (!createBtn) {
        throw new Error('CREATE button not found');
      }
      await userEvent.click(createBtn);
    },
    clickCancel: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const cancelBtn = buttons.find((btn) => btn.textContent === 'CANCEL');
      if (!cancelBtn) {
        throw new Error('CANCEL button not found');
      }
      await userEvent.click(cancelBtn);
    },
    isNewGuildTitleVisible: (): boolean => screen.queryByText('NEW GUILD') !== null,
    isCancelVisible: (): boolean => {
      const buttons = screen.queryAllByTestId('PIXEL_BTN');
      return buttons.some((btn) => btn.textContent === 'CANCEL');
    },
    isBrowseVisible: (): boolean => {
      const buttons = screen.queryAllByTestId('PIXEL_BTN');
      return buttons.some((btn) => btn.textContent === 'BROWSE');
    },
  };
};
