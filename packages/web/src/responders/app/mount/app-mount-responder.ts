/**
 * PURPOSE: Mounts the React application by calling the react-root mount broker with AppRootWidget wrapper
 *
 * USAGE:
 * AppMountResponder({ content });
 * // Renders the app into the #root DOM element wrapped in AppRootWidget providers
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { reactRootMountBroker } from '../../../brokers/react-root/mount/react-root-mount-broker';
import { AppRootWidget } from '../../../widgets/app-root/app-root-widget';

export const AppMountResponder = ({
  content,
}: {
  content: Parameters<typeof reactRootMountBroker>[0]['content'];
}): AdapterResult => {
  reactRootMountBroker({ rootElementId: 'root', Wrapper: AppRootWidget, content });
  return adapterResultContract.parse({ success: true });
};
