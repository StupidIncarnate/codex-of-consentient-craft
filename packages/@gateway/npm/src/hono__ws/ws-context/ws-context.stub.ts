/**
 * PURPOSE: A real `WSContext`, built through the real constructor. `send` receives what the code
 * under test sends, so a caller can record it; `close` does nothing because a WSContext has no
 * connection behind it here.
 *
 * USAGE:
 * const ws = WsContextStub({ send: (data) => sent.push(data) });
 * // Returns a real WSContext with readyState 1 (open)
 */
import { WSContext } from 'hono/ws';
import type { WSReadyState } from 'hono/ws';

export const WsContextStub = ({
  send = (): void => undefined,
  readyState = 1,
}: {
  send?: (data: string | ArrayBuffer | Uint8Array) => void;
  readyState?: WSReadyState;
} = {}): WSContext => new WSContext({ send, close: (): void => undefined, readyState });
