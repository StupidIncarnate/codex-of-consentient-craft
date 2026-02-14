import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const PixelBtnWidgetProxy = (): {
  clickButton: () => Promise<void>;
  hasLabel: (params: { text: string }) => boolean;
} => ({
  clickButton: async (): Promise<void> => {
    await userEvent.click(screen.getByTestId('PIXEL_BTN'));
  },
  hasLabel: ({ text }: { text: string }): boolean => {
    const element = screen.queryByTestId('PIXEL_BTN');
    return element?.textContent === text;
  },
});
