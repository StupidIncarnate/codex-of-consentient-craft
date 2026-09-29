import { screen } from '#gateway/npm/testing-library__react';

export const AppRootWidgetProxy = (): {
  hasChildren: () => boolean;
} => ({
  hasChildren: (): boolean => screen.queryByTestId('APP_ROOT_CHILDREN') !== null,
});
