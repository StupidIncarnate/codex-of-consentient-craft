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
  };
};
