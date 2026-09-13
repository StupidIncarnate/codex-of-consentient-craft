import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const SessionRowLayerWidgetProxy = (): {
  isRowVisible: (params: { testId: string }) => boolean;
  getRowOpacity: (params: { testId: string }) => CSSStyleDeclaration['opacity'];
  getSessionDisplayText: (params: { testId: string }) => HTMLElement['textContent'];
  hasQuestBadge: (params: { testId: string }) => boolean;
  getQuestBadgeText: (params: { testId: string }) => HTMLElement['textContent'];
  getStatusText: (params: { testId: string }) => HTMLElement['textContent'];
  getStatusColor: (params: { testId: string }) => CSSStyleDeclaration['color'];
  clickSession: (params: { testId: string }) => Promise<void>;
} => ({
  isRowVisible: ({ testId }: { testId: string }): boolean => screen.queryByTestId(testId) !== null,
  getRowOpacity: ({ testId }: { testId: string }): CSSStyleDeclaration['opacity'] =>
    screen.getByTestId(testId).style.opacity,
  getSessionDisplayText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
    const element = screen.queryByTestId(testId);
    if (!element) {
      return null;
    }
    const span = element.querySelector('span');
    return span?.textContent ?? null;
  },
  hasQuestBadge: ({ testId }: { testId: string }): boolean => screen.queryByTestId(testId) !== null,
  getQuestBadgeText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
    const element = screen.queryByTestId(testId);
    return element?.textContent ?? null;
  },
  getStatusText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
    const element = screen.queryByTestId(testId);
    return element?.textContent ?? null;
  },
  getStatusColor: ({ testId }: { testId: string }): CSSStyleDeclaration['color'] => {
    const element = screen.getByTestId(testId);
    return element.style.color;
  },
  clickSession: async ({ testId }: { testId: string }): Promise<void> => {
    await userEvent.click(screen.getByTestId(testId), userEventStatics.options);
  },
});
