/**
 * PURPOSE: Mounts a React component tree into a DOM element using react-dom/client
 *
 * USAGE:
 * reactDomMountAdapter({ rootElementId: 'root', Wrapper: AppRootWidget, content: createElement('div') });
 * // Mounts content wrapped in Wrapper into the DOM element with given ID
 */
import '@mantine/core/styles.css';

import { type ComponentType, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const reactDomMountAdapter = ({
  rootElementId,
  Wrapper,
  content,
}: {
  rootElementId: string;
  Wrapper: ComponentType<{ children: ReactNode }>;
  content: ReactNode;
}): AdapterResult => {
  const element = document.getElementById(rootElementId);

  if (!element) {
    throw new Error(`Root element not found: ${rootElementId}`);
  }

  const root = createRoot(element);

  root.render(createElement(Wrapper, null, content));

  return { success: true as const };
};
