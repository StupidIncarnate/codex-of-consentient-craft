import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const FormInputWidgetProxy = (): {
  changeValue: (params: { value: string }) => Promise<void>;
  getValue: () => string;
} => ({
  changeValue: async ({ value }: { value: string }): Promise<void> => {
    const input = screen.getByTestId('FORM_INPUT');
    await userEvent.clear(input);
    await userEvent.type(input, value, userEventStatics.options);
  },
  getValue: (): string => {
    const input = screen.getByTestId<HTMLInputElement>('FORM_INPUT');
    return input.value;
  },
});
