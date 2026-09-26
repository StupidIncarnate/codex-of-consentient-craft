import { Readable } from 'stream';
import { readStdinToEnd } from './read-stdin-to-end';

const withFakeStdin = async ({
  fake,
  run,
}: {
  fake: Readable;
  run: () => Promise<string>;
}): Promise<string> => {
  const original = Object.getOwnPropertyDescriptor(process, 'stdin');
  Object.defineProperty(process, 'stdin', { value: fake, configurable: true });

  const result = await run();

  Object.defineProperty(process, 'stdin', original!);
  return result;
};

describe('readStdinToEnd', () => {
  it('VALID: {stdin carrying two Buffer chunks} => resolves the concatenated string', async () => {
    // process.stdin yields Buffer chunks in production (binary mode unless setEncoding is
    // called), so the fake stream mirrors that shape rather than plain JS strings.
    const result = await withFakeStdin({
      fake: Readable.from([Buffer.from('hello '), Buffer.from('world')]),
      run: readStdinToEnd,
    });

    expect(result).toBe('hello world');
  });

  it('EMPTY: {stdin closed immediately} => resolves an empty string', async () => {
    const result = await withFakeStdin({
      fake: Readable.from([]),
      run: readStdinToEnd,
    });

    expect(result).toBe('');
  });
});
