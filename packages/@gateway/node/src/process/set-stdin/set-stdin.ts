/**
 * PURPOSE: Swaps `process.stdin` for a stream the caller owns and hands back a `restore` that puts
 * the original descriptor back. The original descriptor is read, never `process.stdin` itself:
 * reading the real getter makes Node open stdin, which leaves a pipe handle open when the host's
 * stdin is a pipe (a jest worker).
 *
 * USAGE:
 * const swap = setStdin({ stream: Readable.from(Buffer.from('{"a":1}', 'utf8')) });
 * // getStdin() and process.stdin now answer the stream; call swap.restore() to undo
 */

export const setStdin = ({
  stream,
}: {
  stream: NodeJS.ReadableStream;
}): { restore: () => void } => {
  const original = Object.getOwnPropertyDescriptor(process, 'stdin');
  Object.defineProperty(process, 'stdin', {
    configurable: true,
    get: () => stream,
  });
  return {
    restore: (): void => {
      if (original === undefined) {
        Reflect.deleteProperty(process, 'stdin');
      } else {
        Object.defineProperty(process, 'stdin', original);
      }
    },
  };
};
