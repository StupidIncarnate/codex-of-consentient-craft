import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const QuestApprovedModalWidgetProxy = (): {
  hasModal: () => boolean;
  getTitle: () => HTMLElement['textContent'];
  clickBeginQuest: () => Promise<void>;
  clickKeepChatting: () => Promise<void>;
  hasNewQuestButton: () => boolean;
} => {
  PixelBtnWidgetProxy();

  return {
    hasModal: (): boolean => screen.queryByTestId('QUEST_APPROVED_MODAL_TITLE') !== null,
    getTitle: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('QUEST_APPROVED_MODAL_TITLE');
      return element?.textContent ?? null;
    },
    // fireEvent.click (not userEvent.click): userEvent checks `pointer-events` before dispatching
    // and throws once beginQuestPending flips the button to `pointer-events: none`, so a raw DOM
    // dispatch is what lets a test attempt a SECOND click while the button is disabled — proving
    // the click never reaches onBeginQuest rather than merely asserting it couldn't physically
    // happen. It's also synchronous, which leaves the gap a double-click test needs: the click
    // resolves before the questStartBroker promise it triggered does.
    clickBeginQuest: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const target = buttons.find((el) => el.textContent === 'Begin Quest');
      if (target) {
        fireEvent.click(target);
      }
      return Promise.resolve();
    },
    clickKeepChatting: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const target = buttons.find((el) => el.textContent === 'Keep Chatting');
      if (target) {
        await userEvent.click(target);
      }
    },
    hasNewQuestButton: (): boolean => {
      const buttons = screen.queryAllByTestId('PIXEL_BTN');
      return buttons.some((el) => el.textContent === 'Start a new Quest');
    },
  };
};
