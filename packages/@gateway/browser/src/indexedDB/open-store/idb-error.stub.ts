/**
 * PURPOSE: A real `DOMException`, built through the real constructor — for a caller staging one of
 * the `IDBRequest.error` shapes `openStore` itself branches on (`VersionError`, or any other named
 * IndexedDB failure). jsdom implements no IndexedDB at all, so no real `IDBOpenDBRequest.error` can
 * be produced by actually opening a database — `DOMException` itself, unlike `IDBDatabase`, IS a
 * real, independently constructible Web API this environment provides, so this builds the real
 * exception type IndexedDB errors actually use rather than casting a plain `{name, message}` object.
 *
 * USAGE:
 * const error = IdbErrorStub({ name: 'VersionError', message: 'requested version is lower' });
 */

export const IdbErrorStub = ({
  name = 'UnknownError',
  message = 'IndexedDB request failed',
}: { name?: string; message?: string } = {}): DOMException => new DOMException(message, name);
