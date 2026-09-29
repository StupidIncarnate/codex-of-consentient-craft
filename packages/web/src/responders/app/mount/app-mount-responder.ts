/**
 * PURPOSE: Mounts the React application by calling the react-root mount broker with AppRootWidget wrapper
 *
 * USAGE:
 * AppMountResponder({ content });
 * // Renders the app into the #root DOM element wrapped in AppRootWidget providers
 */

import { reactRootMountBroker } from '../../../brokers/react-root/mount/react-root-mount-broker';
import { AppRootWidget } from '../../../widgets/app-root/app-root-widget';

export const AppMountResponder = ({
  content,
}: {
  content: Parameters<typeof reactRootMountBroker>[0]['content'];
}): void => {
  reactRootMountBroker({ rootElementId: 'root', Wrapper: AppRootWidget, content });
};
