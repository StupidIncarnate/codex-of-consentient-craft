import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { WsUrlStub } from '../../../contracts/ws-url/ws-url.stub';

type WsUrl = ReturnType<typeof WsUrlStub>;

interface MockSocket {
  onopen: (() => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: (() => void) | null;
  close: jest.Mock;
  send: jest.Mock;
  readyState: typeof WebSocket.OPEN | typeof WebSocket.CONNECTING;
}

const MOCK_READY_STATE_OPEN = 1;
const MOCK_READY_STATE_CONNECTING = 0;

const createMockSocket = ({
  deferOpen,
}: {
  deferOpen: boolean;
}): { socket: MockSocket; sendHandle: MockHandle } => {
  const holder: { onopen: (() => void) | null } = { onopen: null };
  const sendFn = jest.fn();
  // send's return value is never read by websocket-connect-adapter (the wrapper always returns
  // `true` once it decides to call socket.send) — this handle exists purely so getSentMessages
  // can read back the full ordered history through callsMatching instead of an unfiltered escape
  // hatch on the raw jest mock.
  const sendHandle: MockHandle = registerMock({ fn: sendFn });
  // The JSON string a caller sends is never knowable ahead of time (it's the payload under
  // test), so the address is a predicate over the one real invariant: socket.send always
  // receives exactly one string argument.
  sendHandle.calledWith([(data: unknown) => typeof data === 'string']).returns(undefined);

  const socket: MockSocket = {
    get onopen(): (() => void) | null {
      return holder.onopen;
    },
    set onopen(handler: (() => void) | null) {
      holder.onopen = handler;
      if (handler && !deferOpen) {
        handler();
      }
    },
    onmessage: null,
    onclose: null,
    close: jest.fn(),
    send: sendFn,
    readyState: deferOpen
      ? (MOCK_READY_STATE_CONNECTING as typeof WebSocket.CONNECTING)
      : (MOCK_READY_STATE_OPEN as typeof WebSocket.OPEN),
  };

  return { socket, sendHandle };
};

export const websocketConnectAdapterProxy = ({
  deferOpen = false,
  url = WsUrlStub(),
}: {
  deferOpen?: boolean;
  url?: WsUrl;
} = {}): {
  receiveMessage: (params: { data: string }) => void;
  triggerClose: () => void;
  triggerReconnect: () => void;
  triggerOpen: () => void;
  getSocket: () => MockSocket;
  getFirstSocket: () => MockSocket;
  markFirstSocketClosed: () => void;
  getSentMessages: () => unknown[];
} => {
  const state: { sockets: MockSocket[]; sendHandles: MockHandle[] } = {
    sockets: [],
    sendHandles: [],
  };

  const setTimeoutSpy: SpyOnHandle = registerSpyOn({
    object: globalThis,
    method: 'setTimeout',
    passthrough: true,
  });

  const webSocketSpy: SpyOnHandle = registerSpyOn({
    object: globalThis as never,
    method: 'WebSocket',
  });
  webSocketSpy.calledWith([url]).implement((() => {
    const { socket, sendHandle } = createMockSocket({ deferOpen });
    state.sockets.push(socket);
    state.sendHandles.push(sendHandle);
    return socket;
  }) as never);

  (globalThis.WebSocket as unknown as { OPEN: typeof WebSocket.OPEN }).OPEN = MOCK_READY_STATE_OPEN;

  return {
    receiveMessage: ({ data }: { data: string }) => {
      for (const socket of state.sockets) {
        if (socket.onmessage) {
          socket.onmessage(new MessageEvent('message', { data }));
        }
      }
    },

    triggerClose: () => {
      const lastSocket = state.sockets[state.sockets.length - 1];
      if (lastSocket?.onclose) {
        lastSocket.onclose();
      }
    },

    triggerReconnect: () => {
      // The reconnect delay is a private, unexported constant inside web-socket-channel-state.ts
      // — this proxy has no real value to key the scheduled setTimeout call on. There's only ever
      // one reconnect timer in flight at a time, so the last recorded call is unambiguous.
      const calls = setTimeoutSpy.callsMatching([]) as unknown as [() => void][];
      const lastCall = calls[calls.length - 1];
      if (lastCall) {
        lastCall[0]();
      }
    },

    triggerOpen: () => {
      for (const socket of state.sockets) {
        socket.readyState = MOCK_READY_STATE_OPEN as typeof WebSocket.OPEN;
        if (socket.onopen) {
          socket.onopen();
        }
      }
    },

    getSocket: (): MockSocket => {
      const lastSocket = state.sockets[state.sockets.length - 1];
      if (!lastSocket) {
        throw new Error('WebSocket not created yet');
      }
      return lastSocket;
    },

    getFirstSocket: (): MockSocket => {
      const [firstSocket] = state.sockets;
      if (!firstSocket) {
        throw new Error('WebSocket not created yet');
      }
      return firstSocket;
    },

    markFirstSocketClosed: (): void => {
      const [firstSocket] = state.sockets;
      if (!firstSocket) {
        throw new Error('WebSocket not created yet');
      }
      (firstSocket as unknown as { readyState: typeof WebSocket.CLOSED }).readyState =
        WebSocket.CLOSED;
    },

    getSentMessages: (): unknown[] => {
      const allCalls: unknown[] = [];
      for (const sendHandle of state.sendHandles) {
        for (const call of sendHandle.callsMatching([])) {
          allCalls.push(JSON.parse(call[0] as never) as unknown);
        }
      }
      return allCalls;
    },
  };
};
