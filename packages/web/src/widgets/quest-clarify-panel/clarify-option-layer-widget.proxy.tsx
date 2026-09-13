import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const ClarifyOptionLayerWidgetProxy = (): {
  clickOption: () => Promise<void>;
  getOptionText: () => HTMLElement['textContent'];
} => ({
  clickOption: async (): Promise<void> => {
    await userEvent.click(screen.getByTestId('CLARIFY_OPTION'), userEventStatics.options);
  },
  getOptionText: (): HTMLElement['textContent'] => {
    const element = screen.queryByTestId('CLARIFY_OPTION');
    return element?.textContent ?? null;
  },
});
