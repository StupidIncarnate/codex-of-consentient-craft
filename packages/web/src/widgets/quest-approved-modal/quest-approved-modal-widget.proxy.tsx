import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const QuestApprovedModalWidgetProxy = (): {
  hasModal: () => boolean;
  getTitle: () => HTMLElement['textContent'];
  clickBeginQuest: () => Promise<void>;
  clickKeepChatting: () => Promise<void>;
  clickNewQuest: () => Promise<void>;
} => {
  PixelBtnWidgetProxy();

  return {
    hasModal: (): boolean => screen.queryByTestId('QUEST_APPROVED_MODAL_TITLE') !== null,
    getTitle: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('QUEST_APPROVED_MODAL_TITLE');
      return element?.textContent ?? null;
    },
    clickBeginQuest: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const target = buttons.find((el) => el.textContent === 'Begin Quest');
      if (target) {
        await userEvent.click(target);
      }
    },
    clickKeepChatting: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const target = buttons.find((el) => el.textContent === 'Keep Chatting');
      if (target) {
        await userEvent.click(target);
      }
    },
    clickNewQuest: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const target = buttons.find((el) => el.textContent === 'Start a new Quest');
      if (target) {
        await userEvent.click(target);
      }
    },
  };
};
