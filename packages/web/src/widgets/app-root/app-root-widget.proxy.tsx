import { screen } from '@testing-library/react';

import { mantineNotificationsAdapterProxy } from '../../adapters/mantine/notifications/mantine-notifications-adapter.proxy';

export const AppRootWidgetProxy = (): {
  hasChildren: () => boolean;
} => {
  mantineNotificationsAdapterProxy();

  return {
    hasChildren: (): boolean => screen.queryByTestId('APP_ROOT_CHILDREN') !== null,
  };
};
