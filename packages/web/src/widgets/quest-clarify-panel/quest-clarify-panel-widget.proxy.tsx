import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AskUserQuestionOption } from '../../contracts/ask-user-question/ask-user-question-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import { FormInputWidgetProxy } from '../form-input/form-input-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

export const QuestClarifyPanelWidgetProxy = (): {
  clickOption: (params: { label: AskUserQuestionOption['label'] }) => Promise<void>;
  clickOther: () => Promise<void>;
  typeFreeform: (params: { text: FormInputValue }) => Promise<void>;
  submitFreeform: () => Promise<void>;
  getQuestionText: () => HTMLElement['textContent'];
  getCounter: () => HTMLElement['textContent'];
  getOptionLabels: () => HTMLElement['textContent'][];
} => {
  const formInputProxy = FormInputWidgetProxy();
  const pixelBtnProxy = PixelBtnWidgetProxy();

  return {
    clickOption: async ({ label }: { label: AskUserQuestionOption['label'] }): Promise<void> => {
      const options = screen.getAllByTestId('CLARIFY_OPTION');
      const target = options.find((el) => el.textContent?.includes(label));
      if (target) {
        await userEvent.click(target);
      }
    },
    clickOther: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('CLARIFY_OTHER_BTN'));
    },
    typeFreeform: async ({ text }: { text: FormInputValue }): Promise<void> => {
      await formInputProxy.changeValue({ value: text });
    },
    submitFreeform: async (): Promise<void> => {
      await pixelBtnProxy.clickButton();
    },
    getQuestionText: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('CLARIFY_QUESTION_TEXT');
      return element?.textContent ?? null;
    },
    getCounter: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('CLARIFY_COUNTER');
      return element?.textContent ?? null;
    },
    getOptionLabels: (): HTMLElement['textContent'][] => {
      const options = screen.queryAllByTestId('CLARIFY_OPTION');
      return options.map((el) => el.textContent);
    },
  };
};
