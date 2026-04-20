import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormInputWidgetProxy } from '../form-input/form-input-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const QuestTitleBarWidgetProxy = (): {
  hasTitleBar: () => boolean;
  hasTitleText: () => boolean;
  hasTitleInput: () => boolean;
  hasAbandonButton: () => boolean;
  clickAbandon: () => Promise<void>;
  clickConfirmAbandon: () => Promise<void>;
  clickCancelAbandon: () => Promise<void>;
  getAbandonButtons: () => HTMLElement[];
} => {
  FormInputWidgetProxy();
  PixelBtnWidgetProxy();

  const clickAbandonBarButton = async ({ label }: { label: string }): Promise<void> => {
    const abandonBar = screen.queryByTestId('ABANDON_BAR');
    if (!abandonBar) {
      return;
    }
    const buttons = abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
    const target = Array.from(buttons).find((button) => button.textContent === label);
    if (target) {
      await userEvent.click(target);
    }
  };

  return {
    hasTitleBar: (): boolean => screen.queryByTestId('QUEST_TITLE_BAR') !== null,
    hasTitleText: (): boolean => screen.queryByTestId('QUEST_TITLE') !== null,
    hasTitleInput: (): boolean => screen.queryByTestId('FORM_INPUT') !== null,
    hasAbandonButton: (): boolean => {
      const abandonBar = screen.queryByTestId('ABANDON_BAR');
      if (!abandonBar) return false;
      const buttons = abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
      return Array.from(buttons).some((button) => button.textContent === 'ABANDON QUEST');
    },
    clickAbandon: async (): Promise<void> => {
      await clickAbandonBarButton({ label: 'ABANDON QUEST' });
    },
    clickConfirmAbandon: async (): Promise<void> => {
      await clickAbandonBarButton({ label: 'CONFIRM ABANDON' });
    },
    clickCancelAbandon: async (): Promise<void> => {
      await clickAbandonBarButton({ label: 'CANCEL' });
    },
    getAbandonButtons: (): HTMLElement[] => {
      const abandonBar = screen.queryByTestId('ABANDON_BAR');
      if (!abandonBar) return [];
      return Array.from(abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]'));
    },
  };
};
