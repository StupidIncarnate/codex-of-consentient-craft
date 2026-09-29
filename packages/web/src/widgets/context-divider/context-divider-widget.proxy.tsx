import { screen } from '#gateway/npm/testing-library__react';

export const ContextDividerWidgetProxy = (): {
  isDividerVisible: () => boolean;
} => ({
  isDividerVisible: (): boolean => screen.queryByTestId('CONTEXT_DIVIDER') !== null,
});
