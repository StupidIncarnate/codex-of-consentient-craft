/**
 * PURPOSE: Mounts the React application by calling react-dom mount adapter with AppRootWidget wrapper
 *
 * USAGE:
 * AppMountResponder({ content });
 * // Renders the app into the #root DOM element wrapped in AppRootWidget providers
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { reactDomMountAdapter } from '../../../adapters/react-dom/mount/react-dom-mount-adapter';
import { AppRootWidget } from '../../../widgets/app-root/app-root-widget';

export const AppMountResponder = ({
  content,
}: {
  content: Parameters<typeof reactDomMountAdapter>[0]['content'];
}): AdapterResult => {
  reactDomMountAdapter({ rootElementId: 'root', Wrapper: AppRootWidget, content });
  return adapterResultContract.parse({ success: true });
};
