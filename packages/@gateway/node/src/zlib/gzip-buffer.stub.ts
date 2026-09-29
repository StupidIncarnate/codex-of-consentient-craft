/**
 * PURPOSE: A real gzip-compressed `Buffer`, produced by `#gateway/node/zlib`'s own re-exported
 * `gzipSync` — for a caller that needs genuine compressed bytes rather than a hand-typed stand-in.
 *
 * USAGE:
 * const gzipped = GzipBufferStub({ text: 'hello' });
 * // gunzipSync(gzipped).toString() === 'hello'
 */
import { gzipSync } from './zlib';

export const GzipBufferStub = ({ text = 'gzip-stub-content' }: { text?: string } = {}): Buffer =>
  gzipSync(text);
