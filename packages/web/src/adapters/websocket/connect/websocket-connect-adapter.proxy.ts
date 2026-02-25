interface MockSocket {
  onopen: (() => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: (() => void) | null;
  close: jest.Mock;
  send: jest.Mock;
  readyState: typeof WebSocket.OPEN;
}

const MOCK_READY_STATE_OPEN = 1;

const createMockSocket = (): MockSocket => {
  const holder: { onopen: (() => void) | null } = { onopen: null };

  return {
    get onopen(): (() => void) | null {
      return holder.onopen;
    },
    set onopen(handler: (() => void) | null) {
      holder.onopen = handler;
      if (handler) {
        handler();
      }
    },
    onmessage: null,
    onclose: null,
    close: jest.fn(),
    send: jest.fn(),
    readyState: MOCK_READY_STATE_OPEN,
  };
};

export const websocketConnectAdapterProxy = (): {
  receiveMessage: (params: { data: string }) => void;
  triggerClose: () => void;
  getSocket: () => MockSocket;
  getSentMessages: () => unknown[];
} => {
  const state: { sockets: MockSocket[] } = { sockets: [] };

  jest.spyOn(globalThis, 'setTimeout');

  jest.spyOn(globalThis as never, 'WebSocket').mockImplementation((() => {
    const socket = createMockSocket();
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

    getSocket: (): MockSocket => {
      const lastSocket = state.sockets[state.sockets.length - 1];
      if (!lastSocket) {
        throw new Error('WebSocket not created yet');
      }
      return lastSocket;
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
