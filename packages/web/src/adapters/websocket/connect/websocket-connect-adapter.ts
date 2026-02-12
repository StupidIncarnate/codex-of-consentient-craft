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
}: {
  url: string;
  onMessage: (message: unknown) => void;
}): { close: () => void } => {
  let shouldReconnect = true;
  const socket = new globalThis.WebSocket(url);

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
  };
};
