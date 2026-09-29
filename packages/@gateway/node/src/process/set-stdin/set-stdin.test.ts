import { PassThrough } from 'stream';

import { getStdin } from '../get-stdin/get-stdin';
import { setStdin } from './set-stdin';
import { setStdinProxy } from './set-stdin.proxy';

describe('setStdin', () => {
  it('VALID: {stream} => getStdin answers the supplied stream while swapped', () => {
    setStdinProxy();
    const stream = new PassThrough();
    const swap = setStdin({ stream });

    const result = getStdin();
    swap.restore();

    expect(result).toBe(stream);
  });

  // Compares descriptors, never `process.stdin` itself: reading the real getter makes Node build
  // the real stdin, a PIPEWRAP handle left open past the suite when jest's stdin is a pipe.
  it('VALID: {restore called} => puts the original process.stdin descriptor back', () => {
    setStdinProxy();
    const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
    const swap = setStdin({ stream: new PassThrough() });

    swap.restore();

    expect(Object.getOwnPropertyDescriptor(process, 'stdin')).toStrictEqual(originalDescriptor);
  });

  it('VALID: {second swap while swapped} => restoring in reverse order returns the original descriptor', () => {
    setStdinProxy();
    const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
    const first = setStdin({ stream: new PassThrough() });
    const secondStream = new PassThrough();
    const second = setStdin({ stream: secondStream });

    const during = getStdin();
    second.restore();
    first.restore();

    expect({
      during,
      descriptor: Object.getOwnPropertyDescriptor(process, 'stdin'),
    }).toStrictEqual({ during: secondStream, descriptor: originalDescriptor });
  });
});
