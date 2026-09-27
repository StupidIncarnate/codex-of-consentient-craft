/**
 * PURPOSE: A real `MessageEvent`, built through the real constructor — the exact shape `connect`'s
 * own `onmessage` handler reads (`String(event.data)`, then `JSON.parse`), for a caller staging an
 * incoming WebSocket frame without hand-typing a fake event.
 *
 * USAGE:
 * const event = MessageEventStub({ payload: { type: 'ping' } });
 */

export const MessageEventStub = ({
  payload = { type: 'ping' },
}: { payload?: unknown } = {}): MessageEvent =>
  new MessageEvent('message', { data: JSON.stringify(payload) });
