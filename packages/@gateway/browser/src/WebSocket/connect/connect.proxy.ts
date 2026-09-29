import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';

interface MockSocket {
  onopen: (() => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
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
    onerror: null,
    close: jest.fn(),
    send: sendFn,
    readyState: deferOpen
      ? (MOCK_READY_STATE_CONNECTING as typeof WebSocket.CONNECTING)
      : (MOCK_READY_STATE_OPEN as typeof WebSocket.OPEN),
  };

  return { socket, sendHandle };
};

export const connectProxy = ({
  deferOpen = false,
  url = 'ws://localhost:3001/ws',
}: {
  deferOpen?: boolean;
  url?: string;
} = {}): {
  receiveMessage: (params: { data: string }) => void;
  triggerClose: () => void;
  triggerOpen: () => void;
  triggerError: () => void;
  getSocket: () => MockSocket;
  getSentMessages: () => unknown[];
  getConnectionCount: () => number;
} => {
  const state: { sockets: MockSocket[]; sendHandles: MockHandle[] } = {
    sockets: [],
    sendHandles: [],
  };

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
        socket.onmessage?.(new MessageEvent('message', { data }));
      }
    },

    triggerClose: () => {
      const lastSocket = state.sockets.at(-1);
      lastSocket?.onclose?.();
    },

    triggerOpen: () => {
      for (const socket of state.sockets) {
        socket.readyState = MOCK_READY_STATE_OPEN as typeof WebSocket.OPEN;
        socket.onopen?.();
      }
    },

    triggerError: () => {
      const lastSocket = state.sockets.at(-1);
      lastSocket?.onerror?.();
    },

    getSocket: (): MockSocket => {
      const lastSocket = state.sockets.at(-1);
      if (!lastSocket) {
        throw new Error('WebSocket not created yet');
      }
      return lastSocket;
    },

    // One entry per `new WebSocket(url)` at the staged url, so a test can prove several callers share one socket.
    getConnectionCount: (): number => state.sockets.length,

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
