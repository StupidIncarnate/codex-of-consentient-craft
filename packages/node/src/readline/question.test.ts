import { Readable, Writable } from 'stream';
import { question } from './question';

const writableSink = (): Writable =>
  new Writable({
    write(_chunk, _encoding, callback): void {
      callback();
    },
  });

describe('question', () => {
  it('VALID: {typed answer with surrounding whitespace} => resolves the trimmed answer', async () => {
    const input = Readable.from(['  Guild Alpha  \n']);

    const result = await question({
      input,
      output: writableSink(),
      prompt: 'Name: ',
      fallback: 'my-package',
    });

    expect(result).toBe('Guild Alpha');
  });

  it('EMPTY: {stdin ends before any line is typed} => resolves the fallback', async () => {
    const input = Readable.from([]);

    const result = await question({
      input,
      output: writableSink(),
      prompt: 'Name: ',
      fallback: 'my-package',
    });

    expect(result).toBe('my-package');
  });

  it('EMPTY: {answer is only whitespace} => resolves the fallback', async () => {
    const input = Readable.from(['   \n']);

    const result = await question({
      input,
      output: writableSink(),
      prompt: 'Name: ',
      fallback: 'my-package',
    });

    expect(result).toBe('my-package');
  });
});
