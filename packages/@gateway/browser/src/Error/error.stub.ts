/**
 * PURPOSE: A real `Error` instance, built through the real constructor — for a caller staging
 * a value that `errorSchema` accepts without hand-typing a fake one.
 *
 * USAGE:
 * const error = ErrorStub({ message: 'boom' });
 * // Returns a real Error carrying the message
 */

export const ErrorStub = ({ message = 'sample' }: { message?: string } = {}): Error =>
  new Error(message);
