import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DropdownOption } from '../../contracts/dropdown-option/dropdown-option-contract';

export const FormDropdownWidgetProxy = (): {
  selectOption: (params: { value: DropdownOption }) => Promise<void>;
  getValue: () => DropdownOption;
} => ({
  selectOption: async ({ value }: { value: DropdownOption }): Promise<void> => {
    const select = screen.getByTestId('FORM_DROPDOWN');
    await userEvent.selectOptions(select, value);
  },
  getValue: (): DropdownOption => {
    const select = screen.getByTestId<HTMLSelectElement>('FORM_DROPDOWN');
    return select.value as DropdownOption;
  },
});
