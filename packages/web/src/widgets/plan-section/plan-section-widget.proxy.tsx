import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { SectionHeaderWidgetProxy } from '../section-header/section-header-widget.proxy';

export const PlanSectionWidgetProxy = (): {
  clickAdd: () => Promise<void>;
  clickRemove: (params: { index: number }) => Promise<void>;
} => {
  PixelBtnWidgetProxy();
  SectionHeaderWidgetProxy();

  return {
    clickAdd: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const addButton = buttons.find((button) => button.textContent === '+');
      if (addButton) {
        await userEvent.click(addButton);
      }
    },
    clickRemove: async ({ index }: { index: number }): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const removeButtons = buttons.filter((button) => button.textContent === 'x');
      if (removeButtons[index]) {
        await userEvent.click(removeButtons[index]);
      }
    },
  };
};
