interface MockSocket {
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: (() => void) | null;
  close: jest.Mock;
}

const createMockSocket = (): MockSocket => ({
  onmessage: null,
  onclose: null,
  close: jest.fn(),
});

export const websocketConnectAdapterProxy = (): {
  receiveMessage: (params: { data: string }) => void;
  triggerClose: () => void;
  getSocket: () => MockSocket;
} => {
  const state: { socket: MockSocket | null } = { socket: null };

  jest.spyOn(globalThis, 'setTimeout');

  jest.spyOn(globalThis as never, 'WebSocket').mockImplementation((() => {
    const socket = createMockSocket();
    state.socket = socket;
    return socket;
  }) as never);

  return {
    receiveMessage: ({ data }: { data: string }) => {
      if (state.socket?.onmessage) {
        state.socket.onmessage(new MessageEvent('message', { data }));
      }
    },

    triggerClose: () => {
      if (state.socket?.onclose) {
        state.socket.onclose();
      }
    },

    getSocket: (): MockSocket => {
      if (!state.socket) {
        throw new Error('WebSocket not created yet');
      }
      return state.socket;
    },
  };
};
