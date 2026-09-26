/**
 * PURPOSE: Wraps the browser `WebSocket` for a JSON-message connection. Wires `onerror` in
 * addition to `onopen`/`onmessage`/`onclose` — the raw global leaves a connection failure
 * indistinguishable from a clean close, since nothing else here reads the socket's error event.
 * Reconnection stays the caller's job (schedule a fresh `connect()` from `onClose`), and a
 * malformed incoming frame is dropped rather than torn down, so one bad message never kills the
 * connection.
 *
 * USAGE:
 * const connection = connect({
 *   url: 'ws://localhost:3001/ws',
 *   onMessage: (msg) => handleMessage(msg),
 *   onOpen: () => { ... },
 *   onClose: () => { ... },
 *   onError: () => { ... },
 * });
 * connection.close();
 * connection.send({ type: 'subscribe-quest', questId: '...' });
 */

export const connect = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
}: {
  url: string;
  onMessage: (message: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}): { close: () => void; send: (data: Record<string, unknown>) => boolean } => {
  const socket = new globalThis.WebSocket(url);

  socket.onopen = (): void => {
    if (onOpen) {
      onOpen();
    }
  };

  socket.onmessage = (event: MessageEvent): void => {
    try {
      const parsed: unknown = JSON.parse(String(event.data));
      onMessage(parsed);
    } catch {
      // A malformed frame is one bad message from the server, not a reason to tear down the
      // connection — the caller has no way to act on it beyond logging, which onError does not
      // cover (onerror carries no frame content on a real WebSocket).
    }
  };

  socket.onclose = (): void => {
    if (onClose) {
      onClose();
    }
  };

  socket.onerror = (): void => {
    if (onError) {
      onError();
    }
  };

  return {
    close: (): void => {
      socket.close();
    },
    send: (data: Record<string, unknown>): boolean => {
      if (socket.readyState === globalThis.WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
        return true;
      }
      return false;
    },
  };
};
