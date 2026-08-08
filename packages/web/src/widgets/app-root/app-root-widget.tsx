/**
 * PURPOSE: Root wrapper providing BrowserRouter, MantineProvider, and Notifications context. Also
 * the app's only home for genuinely global CSS: a pseudo-element cannot be expressed as a React
 * inline style, so rules like `::selection` have nowhere else to live.
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

const { colors } = emberDepthsThemeStatics;

// Left undeclared, selection falls back to Chrome's blue — off-palette against every warm surface
// here, and it recolours the FOREGROUND too, so warm body text lands on saturated blue at a
// contrast ratio that makes the identifier you are trying to copy the hardest thing on screen.
// Both halves are therefore set: primary fill, bg-deep glyphs.
const SELECTION_CSS = `::selection { background-color: ${colors.primary}; color: ${colors['bg-deep']}; }`;

// React Flow's attribution ships as a light chip — rgba(255,255,255,.5) behind #999 — which lands
// as the brightest object on a warm dark canvas. The credit stays; only its volume changes. The
// element is the library's, so there is no widget to hang an inline style off and this is the only
// place the rule can live. Killing the chip is what does the work: the plate, not the text, is what
// made it shout. Hover returns it to full strength, because a dimmed credit still has to be
// legible and clickable to be a credit at all.
const ATTRIBUTION_CSS = `.react-flow__attribution { background: transparent; padding: 2px 4px; } .react-flow__attribution a { color: ${colors['text-dim']}; font-family: monospace; font-size: 9px; } .react-flow__attribution a:hover { color: ${colors.primary}; }`;

const GLOBAL_CSS = `${SELECTION_CSS} ${ATTRIBUTION_CSS}`;

const NotificationsComponent = mantineNotificationsAdapter();

export interface AppRootWidgetProps {
  children: React.ReactNode;
}

export const AppRootWidget = ({ children }: AppRootWidgetProps): React.JSX.Element => (
  <BrowserRouter>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <style data-testid="APP_ROOT_GLOBAL_CSS">{GLOBAL_CSS}</style>
      <div
        data-testid="APP_ROOT_BG"
        style={{
          backgroundColor: colors['bg-deep'],
          minHeight: '100vh',
        }}
      >
        <NotificationsComponent />
        {children}
      </div>
    </MantineProvider>
  </BrowserRouter>
);
