import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const ClarifyOptionLayerWidgetProxy = (): {
  clickOption: () => Promise<void>;
  getOptionText: () => HTMLElement['textContent'];
  hasCheckbox: () => boolean;
  isChecked: () => boolean;
} => ({
  clickOption: async (): Promise<void> => {
    await userEvent.click(screen.getByTestId('CLARIFY_OPTION'), userEventStatics.options);
  },
  getOptionText: (): HTMLElement['textContent'] => {
    const element = screen.queryByTestId('CLARIFY_OPTION');
    return element?.textContent ?? null;
  },
  hasCheckbox: (): boolean => screen.queryByTestId('CLARIFY_OPTION_CHECKBOX') !== null,
  isChecked: (): boolean =>
    screen.getByTestId('CLARIFY_OPTION_CHECKBOX').getAttribute('aria-checked') === 'true',
});
