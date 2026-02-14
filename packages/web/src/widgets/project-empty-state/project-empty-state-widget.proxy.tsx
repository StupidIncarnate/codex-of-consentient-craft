import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const ProjectEmptyStateWidgetProxy = (): {
  typeGuildName: ({ value }: { value: string }) => Promise<void>;
  typeGuildPath: ({ value }: { value: string }) => Promise<void>;
  clickCreate: () => Promise<void>;
  clickCancel: () => Promise<void>;
  isNewGuildTitleVisible: () => boolean;
  isCancelVisible: () => boolean;
} => {
  PixelBtnWidgetProxy();

  return {
    typeGuildName: async ({ value }: { value: string }): Promise<void> => {
      await userEvent.type(screen.getByTestId('GUILD_NAME_INPUT'), value);
    },
    typeGuildPath: async ({ value }: { value: string }): Promise<void> => {
      await userEvent.type(screen.getByTestId('GUILD_PATH_INPUT'), value);
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
  };
};
