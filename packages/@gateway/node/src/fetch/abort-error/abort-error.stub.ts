/**
 * PURPOSE: The real AbortError a `fetch` rejects with once its signal fires, captured rather than
 * hand-built — `AbortSignal.abort().reason` is the exact object Node's `fetch` (undici) rejects
 * with for an aborted request, a `DOMException` named `AbortError`, not an `Error` subclass.
 * Stage it through `implement(() => Promise.reject(...))`: `registerMock`'s `.rejects()` rebuilds
 * a non-native error as a plain `Error` and loses the name.
 *
 * USAGE:
 * const error = AbortErrorStub();
 * // Returns a real DOMException: { name: 'AbortError', message: 'This operation was aborted' }
 */
export const AbortErrorStub = (): DOMException => {
  const reason: unknown = AbortSignal.abort().reason;

  if (!(reason instanceof DOMException)) {
    throw new TypeError('AbortErrorStub: an aborted signal did not carry a DOMException');
  }

  return reason;
};
