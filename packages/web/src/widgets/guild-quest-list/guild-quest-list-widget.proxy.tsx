import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const GuildQuestListWidgetProxy = (): {
  hasHeader: () => boolean;
  hasEmptyState: () => boolean;
  isQuestVisible: (params: { testId: string }) => boolean;
  getStatusColor: (params: { testId: string }) => boolean;
  clickQuest: (params: { testId: string }) => Promise<void>;
  clickAddButton: () => Promise<void>;
} => {
  PixelBtnWidgetProxy();

  return {
    hasHeader: (): boolean => screen.queryByText('QUESTS') !== null,
    hasEmptyState: (): boolean => screen.queryByTestId('QUEST_EMPTY_STATE') !== null,
    isQuestVisible: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
    getStatusColor: ({ testId }: { testId: string }): boolean => {
      const element = screen.queryByTestId(testId);
      return element !== null;
    },
    clickQuest: async ({ testId }: { testId: string }): Promise<void> => {
      await userEvent.click(screen.getByTestId(testId));
    },
    clickAddButton: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('PIXEL_BTN'));
    },
  };
};
