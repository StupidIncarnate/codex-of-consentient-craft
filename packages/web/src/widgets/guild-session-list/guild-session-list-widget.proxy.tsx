import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const GuildSessionListWidgetProxy = (): {
  hasHeader: () => boolean;
  hasEmptyState: () => boolean;
  isSessionVisible: (params: { testId: string }) => boolean;
  hasQuestBadge: (params: { testId: string }) => boolean;
  getQuestBadgeText: (params: { testId: string }) => HTMLElement['textContent'];
  getStatusText: (params: { testId: string }) => HTMLElement['textContent'];
  getStatusColor: (params: { testId: string }) => CSSStyleDeclaration['color'];
  getFilterValue: () => HTMLInputElement['value'] | null;
  clickSession: (params: { testId: string }) => Promise<void>;
  clickAddButton: () => Promise<void>;
  clickFilterOption: (params: { label: string }) => Promise<void>;
} => {
  PixelBtnWidgetProxy();

  return {
    hasHeader: (): boolean => screen.queryByText('SESSIONS') !== null,
    hasEmptyState: (): boolean => screen.queryByTestId('SESSION_EMPTY_STATE') !== null,
    isSessionVisible: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
    hasQuestBadge: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
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
    getFilterValue: (): HTMLInputElement['value'] | null => {
      const filterEl = screen.queryByTestId('SESSION_FILTER');
      if (!filterEl) {
        return null;
      }
      const checkedInput = filterEl.querySelector<HTMLInputElement>('input:checked');
      return checkedInput?.value ?? null;
    },
    clickSession: async ({ testId }: { testId: string }): Promise<void> => {
      await userEvent.click(screen.getByTestId(testId));
    },
    clickAddButton: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('PIXEL_BTN'));
    },
    clickFilterOption: async ({ label }: { label: string }): Promise<void> => {
      await userEvent.click(screen.getByText(label));
    },
  };
};
