/**
 * PURPOSE: Mounts a React component tree into the DOM element with the given id through
 * react-dom's `createRoot`, the content wrapped in the given wrapper component
 *
 * USAGE:
 * reactRootMountBroker({ rootElementId: 'root', Wrapper: AppRootWidget, content: createElement('div') });
 * // Renders content inside Wrapper into #root; throws when no element has that id
 */
import { createElement } from '#gateway/npm/react';
import type { ComponentType, ReactNode } from '#gateway/npm/react';
import { createRoot } from '#gateway/npm/react-dom__client';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

export const reactRootMountBroker = ({
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

  createRoot(element).render(createElement(Wrapper, null, content));

  return adapterResultContract.parse({ success: true });
};
