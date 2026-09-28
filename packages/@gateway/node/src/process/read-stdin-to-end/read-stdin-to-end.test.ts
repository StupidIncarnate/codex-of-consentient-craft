import { readStdinToEnd } from './read-stdin-to-end';
import { readStdinToEndProxy } from './read-stdin-to-end.proxy';

describe('readStdinToEnd', () => {
  it('VALID: {stdin carrying two Buffer chunks} => resolves the concatenated string', async () => {
    const proxy = readStdinToEndProxy();
    proxy.returns({ contents: 'hello world' });

    const result = await readStdinToEnd();
    proxy.restore();

    expect(result).toBe('hello world');
  });

  it('EMPTY: {stdin closed immediately} => resolves an empty string', async () => {
    const proxy = readStdinToEndProxy();
    proxy.returns({ contents: '' });

    const result = await readStdinToEnd();
    proxy.restore();

    expect(result).toBe('');
  });

  describe('restore', () => {
    it('VALID: {restore called after a staged read} => puts the original process.stdin descriptor back', async () => {
      const originalStdin = process.stdin;
      const proxy = readStdinToEndProxy();
      proxy.returns({ contents: 'staged' });

      await readStdinToEnd();
      proxy.restore();

      expect(process.stdin).toBe(originalStdin);
    });
  });
});
