import { screen } from '@testing-library/react';

export const ContextDividerWidgetProxy = (): {
  isDividerVisible: () => boolean;
} => ({
  isDividerVisible: (): boolean => screen.queryByTestId('CONTEXT_DIVIDER') !== null,
});
