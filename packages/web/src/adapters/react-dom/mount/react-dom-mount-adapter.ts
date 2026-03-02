/**
 * PURPOSE: Mounts a React component tree into a DOM element using react-dom/client
 *
 * USAGE:
 * reactDomMountAdapter({ rootElementId: 'root', Wrapper: AppRootWidget, content: createElement('div') });
 * // Mounts content wrapped in Wrapper into the DOM element with given ID
 */
import '@mantine/core/styles.css';

import { type ComponentType, createElement, type ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const reactDomMountAdapter = ({
  rootElementId,
  Wrapper,
  content,
}: {
  rootElementId: string;
  Wrapper: ComponentType<{ children: ReactNode }>;
  content: ReactNode;
}): void => {
  const element = document.getElementById(rootElementId);

  if (!element) {
    throw new Error(`Root element not found: ${rootElementId}`);
  }

  const root = createRoot(element);

  root.render(createElement(StrictMode, null, createElement(Wrapper, null, content)));
};
