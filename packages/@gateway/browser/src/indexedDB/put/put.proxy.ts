/// <reference lib="dom" />

const buildFakePutRequest = ({
  key,
  errorMessage,
}: {
  key: IDBValidKey;
  errorMessage: string | null;
}): IDBRequest<IDBValidKey> => {
  const request: {
    result: IDBValidKey;
    error: { message: string } | null;
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
  } = {
    result: key,
    error: errorMessage === null ? null : { message: errorMessage },
    onsuccess: null,
    onerror: null,
  };

  queueMicrotask((): void => {
    if (errorMessage !== null) {
      request.onerror?.();
      return;
    }
    request.onsuccess?.();
  });

  return request as unknown as IDBRequest<IDBValidKey>;
};

export const putProxy = (): {
  buildDb: (params: { key: IDBValidKey }) => IDBDatabase;
  buildFailingDb: (params: { errorMessage: string }) => IDBDatabase;
  getCallsFor: () => readonly unknown[][];
} => {
  // The fake db this proxy hands out ignores storeName/value entirely — it always resolves the
  // same staged key or the same staged failure, regardless of what put passes — so there is
  // nothing to stage a tolerant address FOR. What a caller test still needs is read-back: which
  // storeName and value put actually called `put()` with.
  const calls: unknown[][] = [];

  const buildDb = ({
    key,
    errorMessage,
  }: {
    key: IDBValidKey;
    errorMessage: string | null;
  }): IDBDatabase =>
    ({
      transaction: (): unknown => ({
        objectStore: (storeName: string): unknown => ({
          put: (value: unknown): IDBRequest<IDBValidKey> => {
            calls.push([storeName, value]);
            return buildFakePutRequest({ key, errorMessage });
          },
        }),
      }),
    }) as unknown as IDBDatabase;

  return {
    buildDb: ({ key }: { key: IDBValidKey }): IDBDatabase => buildDb({ key, errorMessage: null }),
    buildFailingDb: ({ errorMessage }: { errorMessage: string }): IDBDatabase =>
      buildDb({ key: 0, errorMessage }),
    getCallsFor: (): readonly unknown[][] => calls,
  };
};
