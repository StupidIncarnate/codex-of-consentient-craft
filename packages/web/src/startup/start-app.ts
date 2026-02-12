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
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AppWidget } from '../widgets/app/app-widget';

export const StartApp = (): void => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(
        MantineProvider,
        null,
        React.createElement(Notifications, null),
        React.createElement(AppWidget, null),
      ),
    ),
  );
};

if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  StartApp();
}
