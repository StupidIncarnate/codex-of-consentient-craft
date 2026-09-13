import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const GuildRowLayerWidgetProxy = (): {
  isItemSelected: (params: { testId: string }) => boolean;
  getItemName: (params: { testId: string }) => HTMLElement['textContent'];
  clickItem: (params: { testId: string }) => Promise<void>;
} => ({
  isItemSelected: ({ testId }: { testId: string }): boolean => {
    const element = screen.getByTestId(testId);
    return element.style.color === 'rgb(251, 191, 36)';
  },
  getItemName: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
    const element = screen.queryByTestId(testId);
    return element?.textContent ?? null;
  },
  clickItem: async ({ testId }: { testId: string }): Promise<void> => {
    await userEvent.click(screen.getByTestId(testId), userEventStatics.options);
  },
});
