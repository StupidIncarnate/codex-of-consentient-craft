import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { lineReader } from './line-reader';
import { lineReaderProxy } from './line-reader.proxy';

describe('lineReader', () => {
  it('VALID: {stream emitting two lines} => onLine fires once per line, in order', async () => {
    const proxy = lineReaderProxy();
    const input = Readable.from(['first\nsecond\n']);
    proxy.passesThroughFor({ input: (value) => value === input });
    const reader = lineReader({ input });
    const seen: string[] = [];

    const drained = new Promise<void>((resolve) => {
      input.on('end', () => {
        setImmediate(resolve);
      });
    });
    reader.onLine((line) => {
      seen.push(line);
    });

    await drained;
    reader.close();

    expect(seen).toStrictEqual(['first', 'second']);
  });

  it('ERROR: {stream emits an error event} => onError receives it', async () => {
    const proxy = lineReaderProxy();
    const input = new Readable({
      read(): void {
        // Nothing pushed; the error below fires instead of any data.
      },
    });
    proxy.passesThroughFor({ input: (value) => value === input });
    const reader = lineReader({ input });

    const caught = new Promise<Error>((resolve) => {
      reader.onError(resolve);
    });

    input.emit('error', new Error('stream torn mid-tail'));
    const error = await caught;
    reader.close();

    expect(error.message).toBe('stream torn mid-tail');
  });

  describe('real Readable default', () => {
    it('VALID: {a real Readable, nothing passed through} => the proxy keeps it on the real createInterface', async () => {
      lineReaderProxy();
      const input = Readable.from(['only-line\n']);
      const reader = lineReader({ input });
      const seen: string[] = [];

      const drained = new Promise<void>((resolve) => {
        input.on('end', () => {
          setImmediate(resolve);
        });
      });
      reader.onLine((line) => {
        seen.push(line);
      });

      await drained;
      reader.close();

      expect(seen).toStrictEqual(['only-line']);
    });
  });

  describe('passesThroughFor', () => {
    it('VALID: {a stream-shaped emitter that is no Readable, passed through} => the real reader splits its data into lines', () => {
      const proxy = lineReaderProxy();
      const input = Object.assign(new EventEmitter(), {
        pause: (): void => undefined,
        resume: (): void => undefined,
      });
      proxy.passesThroughFor({ input: (value) => value === input });
      const reader = lineReader({ input: input as never });
      const seen: string[] = [];
      reader.onLine((line) => {
        seen.push(line);
      });

      input.emit('data', 'first\nsecond\n');
      input.emit('end');
      reader.close();

      expect(seen).toStrictEqual(['first', 'second']);
    });

    it('ERROR: {a stream-shaped emitter nothing passes through} => lineReader throws the unstaged-call error', () => {
      const proxy = lineReaderProxy();
      const owned = new EventEmitter();
      const stranger = new EventEmitter();
      proxy.passesThroughFor({ input: (value) => value === owned });

      expect(() => lineReader({ input: stranger as never })).toThrow(
        /^registerMock: nothing set up for the call/u,
      );
    });
  });
});
