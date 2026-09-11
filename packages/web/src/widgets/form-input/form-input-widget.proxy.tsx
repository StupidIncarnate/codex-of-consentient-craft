import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const FormInputWidgetProxy = (): {
  changeValue: (params: { value: FormInputValue }) => Promise<void>;
  getValue: () => FormInputValue;
} => ({
  changeValue: async ({ value }: { value: FormInputValue }): Promise<void> => {
    const input = screen.getByTestId('FORM_INPUT');
    await userEvent.clear(input);
    await userEvent.type(input, value, userEventStatics.options);
  },
  getValue: (): FormInputValue => {
    const input = screen.getByTestId<HTMLInputElement>('FORM_INPUT');
    return input.value as FormInputValue;
  },
});
