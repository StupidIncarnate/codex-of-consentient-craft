import { Readable } from 'stream';

// process.stdin is a global, not an npm dependency with its own mockable call surface, so this
// proxy owns the Object.defineProperty swap itself rather than exposing registerMock — a caller's
// own proxy stages content through `returns` and never touches `process.stdin` directly.
export const readStdinToEndProxy = (): {
  returns: (params: { contents: string }) => void;
  restore: () => void;
} => {
  const original = Object.getOwnPropertyDescriptor(process, 'stdin');

  return {
    returns: ({ contents }: { contents: string }): void => {
      const stream = Readable.from(Buffer.from(contents, 'utf8'));
      Object.defineProperty(process, 'stdin', {
        configurable: true,
        get: () => stream,
      });
    },

    restore: (): void => {
      if (original !== undefined) {
        Object.defineProperty(process, 'stdin', original);
      }
    },
  };
};
