import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const GuildRowLayerWidgetProxy = (): {
  isItemSelected: (params: { testId: string }) => boolean;
  getItemName: (params: { testId: string }) => Node['textContent'];
  clickItem: (params: { testId: string }) => Promise<void>;
  getInvalidMarkerText: (params: { testId: string }) => Node['textContent'];
} => ({
  getInvalidMarkerText: ({ testId }: { testId: string }): Node['textContent'] =>
    screen.queryByTestId(testId)?.textContent ?? null,
  isItemSelected: ({ testId }: { testId: string }): boolean => {
    const element = screen.getByTestId(testId);
    return element.style.color === 'rgb(251, 191, 36)';
  },
  getItemName: ({ testId }: { testId: string }): Node['textContent'] => {
    const element = screen.queryByTestId(testId);
    return element?.textContent ?? null;
  },
  clickItem: async ({ testId }: { testId: string }): Promise<void> => {
    await userEvent.click(screen.getByTestId(testId), userEventStatics.options);
  },
});
