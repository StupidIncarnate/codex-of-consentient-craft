/**
 * PURPOSE: Wraps browser WebSocket for real-time connections with JSON message parsing and auto-reconnect
 *
 * USAGE:
 * const connection = websocketConnectAdapter({url: 'ws://localhost:3001/ws', onMessage: (msg) => handleMessage(msg)});
 * // Returns: {close: () => void}
 * connection.close();
 */

const RECONNECT_DELAY_MS = 3000;

export const websocketConnectAdapter = ({
  url,
  onMessage,
  onOpen,
}: {
  url: string;
  onMessage: (message: unknown) => void;
  onOpen?: () => void;
}): { close: () => void; send: (data: Record<string, unknown>) => boolean } => {
  let shouldReconnect = true;
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
    if (shouldReconnect) {
      globalThis.setTimeout(() => {
        websocketConnectAdapter({ url, onMessage });
      }, RECONNECT_DELAY_MS);
    }
  };

  return {
    close: (): void => {
      shouldReconnect = false;
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
