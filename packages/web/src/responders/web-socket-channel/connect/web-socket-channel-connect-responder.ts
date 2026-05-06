/**
 * PURPOSE: Opens the shared web socket channel for the tab. Called once from AppMountFlow before AppMountResponder so every binding that subscribes during initial render finds an already-connecting channel — no per-binding socket, no race.
 *
 * USAGE:
 * WebSocketChannelConnectResponder();
 * // After this, webSocketChannelState.connect has been invoked with ws[s]://<host>/ws
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { wsUrlContract } from '../../../contracts/ws-url/ws-url-contract';
import { webSocketChannelState } from '../../../state/web-socket-channel/web-socket-channel-state';

export const WebSocketChannelConnectResponder = (): AdapterResult => {
  const protocol = globalThis.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = wsUrlContract.parse(`${protocol}://${globalThis.location.host}/ws`);
  webSocketChannelState.connect({ url });
  return adapterResultContract.parse({ success: true });
};
