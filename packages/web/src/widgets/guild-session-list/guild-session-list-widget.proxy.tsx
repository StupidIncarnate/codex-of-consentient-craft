import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const GuildSessionListWidgetProxy = (): {
  hasHeader: () => boolean;
  hasEmptyState: () => boolean;
  isSessionVisible: (params: { testId: string }) => boolean;
  hasQuestBadge: (params: { testId: string }) => boolean;
  getQuestBadgeText: (params: { testId: string }) => HTMLElement['textContent'];
  getSessionDisplayText: (params: { testId: string }) => HTMLElement['textContent'];
  getStatusText: (params: { testId: string }) => HTMLElement['textContent'];
  getStatusColor: (params: { testId: string }) => CSSStyleDeclaration['color'];
  getFilterValue: () => HTMLInputElement['value'] | null;
  clickSession: (params: { testId: string }) => Promise<void>;
  clickAddButton: () => Promise<void>;
  clickFilterOption: (params: { label: string }) => Promise<void>;
  isDeleteButtonVisible: (params: { testId: string }) => boolean;
  getDeleteButtonAriaLabel: (params: { testId: string }) => HTMLElement['textContent'];
  getDeleteButtonText: (params: { testId: string }) => HTMLElement['textContent'];
  hasDeleteButtonSkullIcon: (params: { testId: string }) => boolean;
  clickDeleteButton: (params: { testId: string }) => Promise<void>;
  isPopoverVisible: (params: { testId: string }) => boolean;
  getPopoverText: (params: { testId: string }) => HTMLElement['textContent'];
  getVisiblePopoverTestIds: () => readonly HTMLElement['textContent'][];
  isBanishButtonDisabled: () => boolean;
  clickBanish: () => Promise<void>;
  clickSpare: () => Promise<void>;
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
    getSessionDisplayText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      if (!element) {
        return null;
      }
      const span = element.querySelector('span');
      return span?.textContent ?? null;
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
    isDeleteButtonVisible: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
    getDeleteButtonAriaLabel: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      return element?.getAttribute('aria-label') ?? null;
    },
    getDeleteButtonText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      return element?.textContent ?? null;
    },
    hasDeleteButtonSkullIcon: ({ testId }: { testId: string }): boolean => {
      const element = screen.queryByTestId(testId);
      return Boolean(element?.querySelector('[data-testid="IconSkull"]'));
    },
    clickDeleteButton: async ({ testId }: { testId: string }): Promise<void> => {
      await userEvent.click(screen.getByTestId(testId));
    },
    isPopoverVisible: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
    getPopoverText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      const paragraph = element?.querySelector('p');
      return paragraph?.textContent ?? element?.textContent ?? null;
    },
    getVisiblePopoverTestIds: (): readonly HTMLElement['textContent'][] =>
      Array.from(document.querySelectorAll('[data-testid^="QUEST_DELETE_POPOVER_"]')).map(
        (element) => element.getAttribute('data-testid'),
      ),
    isBanishButtonDisabled: (): boolean => {
      const banish = screen.getByText('Banish');
      const button = banish.closest('button');
      return button?.disabled === true;
    },
    clickBanish: async (): Promise<void> => {
      await userEvent.click(screen.getByText('Banish'));
    },
    clickSpare: async (): Promise<void> => {
      await userEvent.click(screen.getByText('Spare'));
    },
  };
};
