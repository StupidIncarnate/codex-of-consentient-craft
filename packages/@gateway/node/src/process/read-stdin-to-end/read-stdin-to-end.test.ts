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
    // Compares descriptors, never `process.stdin` itself: reading the real getter makes Node build
    // the real stdin, and when the jest process's stdin is a pipe that is a PIPEWRAP handle left open
    // past the suite (reported by `--detectOpenHandles`).
    it('VALID: {restore called after a staged read} => puts the original process.stdin descriptor back', async () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
      const proxy = readStdinToEndProxy();
      proxy.returns({ contents: 'staged' });

      await readStdinToEnd();
      proxy.restore();

      expect(Object.getOwnPropertyDescriptor(process, 'stdin')).toStrictEqual(originalDescriptor);
    });
  });
});
