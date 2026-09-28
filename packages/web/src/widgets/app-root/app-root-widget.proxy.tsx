import { screen } from '@testing-library/react';

export const AppRootWidgetProxy = (): {
  hasChildren: () => boolean;
} => ({
  hasChildren: (): boolean => screen.queryByTestId('APP_ROOT_CHILDREN') !== null,
});
