/**
 * PURPOSE: A real `Error`, built through the real `Error` constructor — for a caller staging what
 * `isNativeError` (this folder's own wrapper) checks against, rather than a hand-typed object cast
 * as `Error`.
 *
 * USAGE:
 * const error = NativeErrorStub({ message: 'boom' });
 * isNativeError(error); // true
 */

export const NativeErrorStub = ({ message = 'boom' }: { message?: string } = {}): Error =>
  new Error(message);
