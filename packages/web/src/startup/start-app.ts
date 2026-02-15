/**
 * PURPOSE: Initializes React app with Mantine provider and renders root widget
 *
 * USAGE:
 * StartApp();
 * // Mounts React app into #root DOM element
 */

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { emberDepthsThemeStatics } from '../statics/ember-depths-theme/ember-depths-theme-statics';
import { AppWidget } from '../widgets/app/app-widget';

const theme = createTheme({
  fontFamily: 'monospace',
  defaultRadius: 2,
});

export const StartApp = (): void => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  const { colors } = emberDepthsThemeStatics;

  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(
          MantineProvider,
          { theme, forceColorScheme: 'dark' as const },
          React.createElement(
            'div',
            { style: { backgroundColor: colors['bg-deep'], minHeight: '100vh' } },
            React.createElement(Notifications, null),
            React.createElement(AppWidget, null),
          ),
        ),
      ),
    ),
  );
};

if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  StartApp();
}
