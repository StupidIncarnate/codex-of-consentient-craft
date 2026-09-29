/**
 * PURPOSE: Orchestrates React app mounting by passing route tree to mount responder
 *
 * USAGE:
 * AppMountFlow();
 * // Mounts the React app with AppFlow as content
 */

import { AppFlow } from '../app/app-flow';
import { AppMountResponder } from '../../responders/app/mount/app-mount-responder';
import { WebSocketChannelConnectResponder } from '../../responders/web-socket-channel/connect/web-socket-channel-connect-responder';

export const AppMountFlow = (): void => {
  WebSocketChannelConnectResponder();
  AppMountResponder({ content: <AppFlow /> });
};
