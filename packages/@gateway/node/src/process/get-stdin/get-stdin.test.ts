import { getStdin } from './get-stdin';
import { getStdinProxy } from './get-stdin.proxy';

describe('getStdin', () => {
  it('VALID: {process.stdin staged} => returns the staged stream, read at call time', () => {
    const proxy = getStdinProxy();
    const stream = proxy.setupStream();

    const result = getStdin();
    proxy.restore();

    expect(result).toBe(stream);
  });

  it('VALID: {stdin swapped between calls} => each call reads the current process.stdin', () => {
    const proxy = getStdinProxy();
    const first = proxy.setupStream();
    const before = getStdin();
    const second = proxy.setupStream();

    const after = getStdin();
    proxy.restore();

    expect({ before, after }).toStrictEqual({ before: first, after: second });
  });

  // Compares descriptors, never `process.stdin` itself: reading the real getter makes Node build the
  // real stdin, which is a PIPEWRAP handle left open past the suite when jest's stdin is a pipe.
  it('VALID: {restore called} => puts the original process.stdin descriptor back', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
    const proxy = getStdinProxy();
    proxy.setupStream();

    proxy.restore();

    expect(Object.getOwnPropertyDescriptor(process, 'stdin')).toStrictEqual(originalDescriptor);
  });
});
