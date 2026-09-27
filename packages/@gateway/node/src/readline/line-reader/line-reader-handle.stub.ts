/**
 * PURPOSE: A real `lineReader` handle, built by calling `#gateway/node/readline`'s own
 * `lineReader` against a real `Readable` (Node's own `stream` module — the gateway may import a
 * Node builtin unwrapped, since it IS the wrapper) — for a caller that needs a genuine handle
 * rather than a hand-typed one.
 *
 * USAGE:
 * const reader = LineReaderHandleStub();
 * reader.onLine((line) => { ... });
 */
import { Readable } from 'stream';
import { lineReader } from './line-reader';

export const LineReaderHandleStub = ({ line = 'stub-line' }: { line?: string } = {}): ReturnType<
  typeof lineReader
> => lineReader({ input: Readable.from([`${line}\n`]) });
