import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';


import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const FormDropdownWidgetProxy = (): {
  selectOption: (params: { value: string }) => Promise<void>;
  getValue: () => string;
} => ({
  selectOption: async ({ value }: { value: string }): Promise<void> => {
    const select = screen.getByTestId('FORM_DROPDOWN');
    await userEvent.selectOptions(select, value, userEventStatics.options);
  },
  getValue: (): string => {
    const select = screen.getByTestId<HTMLSelectElement>('FORM_DROPDOWN');
    return select.value as string;
  },
});
