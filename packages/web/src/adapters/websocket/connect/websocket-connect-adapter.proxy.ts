import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

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

const createMockSocket = ({ deferOpen }: { deferOpen: boolean }): MockSocket => {
  const holder: { onopen: (() => void) | null } = { onopen: null };

  return {
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
    send: jest.fn(),
    readyState: deferOpen
      ? (MOCK_READY_STATE_CONNECTING as typeof WebSocket.CONNECTING)
      : (MOCK_READY_STATE_OPEN as typeof WebSocket.OPEN),
  };
};

export const websocketConnectAdapterProxy = ({ deferOpen = false }: { deferOpen?: boolean } = {}): {
  receiveMessage: (params: { data: string }) => void;
  triggerClose: () => void;
  triggerReconnect: () => void;
  triggerOpen: () => void;
  getSocket: () => MockSocket;
  getFirstSocket: () => MockSocket;
  markFirstSocketClosed: () => void;
  getSentMessages: () => unknown[];
} => {
  const state: { sockets: MockSocket[] } = { sockets: [] };

  const setTimeoutSpy = registerSpyOn({
    object: globalThis,
    method: 'setTimeout',
    passthrough: true,
  });

  const webSocketSpy = registerSpyOn({ object: globalThis as never, method: 'WebSocket' });
  webSocketSpy.mockImplementation((() => {
    const socket = createMockSocket({ deferOpen });
    state.sockets.push(socket);
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
      const calls = setTimeoutSpy.mock.calls as unknown as [() => void][];
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
      const firstSocket = state.sockets[0];
      if (!firstSocket) {
        throw new Error('WebSocket not created yet');
      }
      return firstSocket;
    },

    markFirstSocketClosed: (): void => {
      const firstSocket = state.sockets[0];
      if (!firstSocket) {
        throw new Error('WebSocket not created yet');
      }
      (firstSocket as unknown as { readyState: typeof WebSocket.CLOSED }).readyState =
        WebSocket.CLOSED;
    },

    getSentMessages: (): unknown[] => {
      const allCalls: unknown[] = [];
      for (const socket of state.sockets) {
        for (const call of socket.send.mock.calls as [unknown][]) {
          allCalls.push(JSON.parse(call[0] as never) as unknown);
        }
      }
      return allCalls;
    },
  };
};
