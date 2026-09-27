/**
 * PURPOSE: A real `Buffer` instance, built through `#gateway/node/buffer`'s own re-exported
 * `Buffer.from` — for a caller that needs a genuine buffer rather than a hand-typed one.
 *
 * USAGE:
 * const buffer = BufferInstanceStub({ text: 'hello' });
 * // Returns a real Buffer whose contents are the utf8 bytes of 'hello'
 */
import { Buffer } from './buffer';

export const BufferInstanceStub = ({ text = 'hello' }: { text?: string } = {}): Buffer =>
  Buffer.from(text, 'utf8');
