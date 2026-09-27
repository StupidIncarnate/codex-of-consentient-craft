import { Readable } from 'stream';
import { lineReader } from './line-reader';

describe('lineReader', () => {
  it('VALID: {stream emitting two lines} => onLine fires once per line, in order', async () => {
    const input = Readable.from(['first\nsecond\n']);
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
    const input = new Readable({
      read(): void {
        // Nothing pushed; the error below fires instead of any data.
      },
    });
    const reader = lineReader({ input });

    const caught = new Promise<Error>((resolve) => {
      reader.onError(resolve);
    });

    input.emit('error', new Error('stream torn mid-tail'));
    const error = await caught;
    reader.close();

    expect(error.message).toBe('stream torn mid-tail');
  });
});
