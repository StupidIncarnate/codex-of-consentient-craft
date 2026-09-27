/**
 * PURPOSE: A real `StdioServerTransport`, built through the real constructor — over real, but
 * inert, `Readable`/`Writable` streams (never the real process stdio, which this gateway's own
 * `#gateway/node/process` owns) — for a caller staging this subpath's own value instead of
 * hand-typing a fake transport.
 *
 * USAGE:
 * const transport = StdioServerTransportStub({ stdout: myWritable });
 * // Returns a real, unstarted StdioServerTransport over the given (or a default, inert) stdout
 */
import { Readable, Writable } from 'node:stream';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export const StdioServerTransportStub = ({
  stdin = new Readable({ read: (): void => undefined }),
  stdout = new Writable({
    write: (_chunk, _encoding, callback): void => {
      callback();
    },
  }),
}: { stdin?: Readable; stdout?: Writable } = {}): StdioServerTransport =>
  new StdioServerTransport(stdin, stdout);
