import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormInputWidgetProxy } from '../form-input/form-input-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { ContractsLayerWidgetProxy } from './contracts-layer-widget.proxy';
import { ObservablesLayerWidgetProxy } from './observables-layer-widget.proxy';
import { RequirementsLayerWidgetProxy } from './requirements-layer-widget.proxy';

export const QuestSpecPanelWidgetProxy = (): {
  clickModify: () => Promise<void>;
  clickApprove: () => Promise<void>;
  clickSubmit: () => Promise<void>;
  clickCancel: () => Promise<void>;
  clickReload: () => Promise<void>;
  clickKeepEditing: () => Promise<void>;
  hasBanner: () => boolean;
} => {
  FormInputWidgetProxy();
  PixelBtnWidgetProxy();
  ContractsLayerWidgetProxy();
  ObservablesLayerWidgetProxy();
  RequirementsLayerWidgetProxy();

  return {
    clickModify: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const modifyButton = buttons.find((button) => button.textContent === 'MODIFY');
      if (modifyButton) {
        await userEvent.click(modifyButton);
      }
    },
    clickApprove: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');
      if (approveButton) {
        await userEvent.click(approveButton);
      }
    },
    clickSubmit: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const submitButton = buttons.find((button) => button.textContent === 'SUBMIT');
      if (submitButton) {
        await userEvent.click(submitButton);
      }
    },
    clickCancel: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const cancelButton = buttons.find((button) => button.textContent === 'CANCEL');
      if (cancelButton) {
        await userEvent.click(cancelButton);
      }
    },
    clickReload: async (): Promise<void> => {
      const banner = screen.queryByTestId('EXTERNAL_UPDATE_BANNER');
      if (banner) {
        const buttons = banner.querySelectorAll('[data-testid="PIXEL_BTN"]');
        const reloadButton = Array.from(buttons).find((button) => button.textContent === 'RELOAD');
        if (reloadButton) {
          await userEvent.click(reloadButton);
        }
      }
    },
    clickKeepEditing: async (): Promise<void> => {
      const banner = screen.queryByTestId('EXTERNAL_UPDATE_BANNER');
      if (banner) {
        const buttons = banner.querySelectorAll('[data-testid="PIXEL_BTN"]');
        const keepButton = Array.from(buttons).find(
          (button) => button.textContent === 'KEEP EDITING',
        );
        if (keepButton) {
          await userEvent.click(keepButton);
        }
      }
    },
    hasBanner: (): boolean => screen.queryByTestId('EXTERNAL_UPDATE_BANNER') !== null,
  };
};
