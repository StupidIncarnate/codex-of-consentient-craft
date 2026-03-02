/**
 * PURPOSE: Mounts the React application by calling react-dom mount adapter with AppRootWidget wrapper
 *
 * USAGE:
 * AppMountResponder({ content });
 * // Renders the app into the #root DOM element wrapped in AppRootWidget providers
 */

import { reactDomMountAdapter } from '../../../adapters/react-dom/mount/react-dom-mount-adapter';
import { AppRootWidget } from '../../../widgets/app-root/app-root-widget';

export const AppMountResponder = ({
  content,
}: {
  content: Parameters<typeof reactDomMountAdapter>[0]['content'];
}): void => {
  reactDomMountAdapter({ rootElementId: 'root', Wrapper: AppRootWidget, content });
};
