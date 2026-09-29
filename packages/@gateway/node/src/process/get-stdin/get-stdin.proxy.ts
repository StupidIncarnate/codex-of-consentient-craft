import { PassThrough } from 'stream';

// process.stdin is a global with no mockable call surface, so `setupStream` swaps the property for
// a stream the test owns. Reading the real `process.stdin` would open Node's stdin, which is what
// this wrapper exists to keep from happening in a test.
export const getStdinProxy = (): {
  setupStream: () => PassThrough;
  restore: () => void;
} => {
  const original = Object.getOwnPropertyDescriptor(process, 'stdin');

  return {
    setupStream: (): PassThrough => {
      const stream = new PassThrough();
      Object.defineProperty(process, 'stdin', {
        configurable: true,
        get: () => stream,
      });
      return stream;
    },

    restore: (): void => {
      if (original !== undefined) {
        Object.defineProperty(process, 'stdin', original);
      }
    },
  };
};
