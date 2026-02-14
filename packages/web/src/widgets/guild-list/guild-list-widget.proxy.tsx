import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const GuildListWidgetProxy = (): {
  isItemVisible: (params: { testId: string }) => boolean;
  isItemSelected: (params: { testId: string }) => boolean;
  clickItem: (params: { testId: string }) => Promise<void>;
  clickAddButton: () => Promise<void>;
  hasHeader: () => boolean;
} => {
  PixelBtnWidgetProxy();

  return {
    isItemVisible: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
    isItemSelected: ({ testId }: { testId: string }): boolean => {
      const element = screen.getByTestId(testId);
      return element.style.color === 'rgb(251, 191, 36)';
    },
    clickItem: async ({ testId }: { testId: string }): Promise<void> => {
      await userEvent.click(screen.getByTestId(testId));
    },
    clickAddButton: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('PIXEL_BTN'));
    },
    hasHeader: (): boolean => screen.queryByText('GUILDS') !== null,
  };
};
