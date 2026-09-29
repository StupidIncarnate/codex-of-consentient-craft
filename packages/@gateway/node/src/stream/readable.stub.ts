/**
 * PURPOSE: A real `Readable` that yields the given chunks and ends, built through
 * `#gateway/node/stream`'s own re-exported `Readable` — for a caller that needs a genuine stream
 * rather than a hand-typed stand-in.
 *
 * USAGE:
 * const readable = ReadableStub({ chunks: ['a', 'b'] });
 * // Emits 'a' then 'b' in object mode, then ends
 */
import { Readable } from './stream';

export const ReadableStub = ({ chunks = ['chunk'] }: { chunks?: string[] } = {}): Readable =>
  Readable.from(chunks);
