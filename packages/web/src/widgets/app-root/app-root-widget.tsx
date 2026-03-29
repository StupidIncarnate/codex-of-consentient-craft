/**
 * PURPOSE: Root wrapper providing BrowserRouter, MantineProvider, and Notifications context
 *
 * USAGE:
 * <AppRootWidget>{children}</AppRootWidget>
 * // Wraps children in BrowserRouter, MantineProvider (dark), and Notifications
 */
import { createTheme, MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';

import { mantineNotificationsAdapter } from '../../adapters/mantine/notifications/mantine-notifications-adapter';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const theme = createTheme({ fontFamily: 'monospace', defaultRadius: 2 });

const NotificationsComponent = mantineNotificationsAdapter();

export interface AppRootWidgetProps {
  children: React.ReactNode;
}

export const AppRootWidget = ({ children }: AppRootWidgetProps): React.JSX.Element => (
  <BrowserRouter>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <div
        data-testid="APP_ROOT_BG"
        style={{
          backgroundColor: emberDepthsThemeStatics.colors['bg-deep'],
          minHeight: '100vh',
        }}
      >
        <NotificationsComponent />
        {children}
      </div>
    </MantineProvider>
  </BrowserRouter>
);
