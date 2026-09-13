import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IconButtonWidgetProxy } from '../icon-button/icon-button-widget.proxy';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const QuestRowLayerWidgetProxy = (): {
  isRowVisible: (params: { testId: string }) => boolean;
  clickRow: (params: { testId: string }) => Promise<void>;
  getRowOpacity: (params: { testId: string }) => CSSStyleDeclaration['opacity'];
  getStatusText: (params: { testId: string }) => HTMLElement['textContent'];
  getStatusColor: (params: { testId: string }) => CSSStyleDeclaration['color'];
  isDeleteButtonVisible: (params: { testId: string }) => boolean;
  getDeleteButtonAriaLabel: (params: { testId: string }) => HTMLElement['textContent'];
  getDeleteButtonText: (params: { testId: string }) => HTMLElement['textContent'];
  hasDeleteButtonSkullIcon: (params: { testId: string }) => boolean;
  clickDeleteButton: (params: { testId: string }) => Promise<void>;
  isPopoverVisible: (params: { testId: string }) => boolean;
  getPopoverText: (params: { testId: string }) => HTMLElement['textContent'];
  isBanishButtonDisabled: () => boolean;
  clickBanish: () => Promise<void>;
  clickSpare: () => Promise<void>;
} => {
  IconButtonWidgetProxy();

  return {
    isRowVisible: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
    clickRow: async ({ testId }: { testId: string }): Promise<void> => {
      await userEvent.click(screen.getByTestId(testId), userEventStatics.options);
    },
    getRowOpacity: ({ testId }: { testId: string }): CSSStyleDeclaration['opacity'] =>
      screen.getByTestId(testId).style.opacity,
    getStatusText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      return element?.textContent ?? null;
    },
    getStatusColor: ({ testId }: { testId: string }): CSSStyleDeclaration['color'] => {
      const element = screen.getByTestId(testId);
      return element.style.color;
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
      await userEvent.click(screen.getByTestId(testId), userEventStatics.options);
    },
    isPopoverVisible: ({ testId }: { testId: string }): boolean =>
      screen.queryByTestId(testId) !== null,
    getPopoverText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      const paragraph = element?.querySelector('p');
      return paragraph?.textContent ?? element?.textContent ?? null;
    },
    isBanishButtonDisabled: (): boolean => {
      const banish = screen.getByText('Banish');
      const button = banish.closest('button');
      return button?.disabled === true;
    },
    clickBanish: async (): Promise<void> => {
      await userEvent.click(screen.getByText('Banish'), userEventStatics.options);
    },
    clickSpare: async (): Promise<void> => {
      await userEvent.click(screen.getByText('Spare'), userEventStatics.options);
    },
  };
};
