/**
 * PURPOSE: Opens the shared web socket channel for the tab. Called once from AppMountFlow before AppMountResponder so every binding that subscribes during initial render finds an already-connecting channel — no per-binding socket, no race.
 *
 * USAGE:
 * WebSocketChannelConnectResponder();
 * // After this, webSocketChannelState.connect has been invoked with ws[s]://<host>/ws
 */

import { location } from '#gateway/browser/location';

import { webSocketChannelState } from '../../../state/web-socket-channel/web-socket-channel-state';

export const WebSocketChannelConnectResponder = (): void => {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${location.host}/ws`;
  webSocketChannelState.connect({ url });
};
