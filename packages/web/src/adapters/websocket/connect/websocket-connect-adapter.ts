/**
 * PURPOSE: Wraps browser WebSocket for real-time connections with JSON message parsing. Reconnect is owned by the consumer (the web-socket-channel state module) which uses the onClose callback to schedule a fresh connection.
 *
 * USAGE:
 * const connection = websocketConnectAdapter({
 *   url: 'ws://localhost:3001/ws',
 *   onMessage: (msg) => handleMessage(msg),
 *   onOpen: () => { ... },
 *   onClose: () => { ... },
 * });
 * connection.close();
 * connection.send({type: 'subscribe-quest', questId: '...'});
 */

export const websocketConnectAdapter = ({
  url,
  onMessage,
  onOpen,
  onClose,
}: {
  url: string;
  onMessage: (message: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
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
      // Malformed JSON is silently ignored
    }
  };

  socket.onclose = (): void => {
    if (onClose) {
      onClose();
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
