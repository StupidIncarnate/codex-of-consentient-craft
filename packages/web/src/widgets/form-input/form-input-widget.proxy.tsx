import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';

export const FormInputWidgetProxy = (): {
  changeValue: (params: { value: FormInputValue }) => Promise<void>;
  getValue: () => FormInputValue;
} => ({
  changeValue: async ({ value }: { value: FormInputValue }): Promise<void> => {
    const input = screen.getByTestId('FORM_INPUT');
    await userEvent.clear(input);
    await userEvent.type(input, value);
  },
  getValue: (): FormInputValue => {
    const input = screen.getByTestId<HTMLInputElement>('FORM_INPUT');
    return input.value as FormInputValue;
  },
});
