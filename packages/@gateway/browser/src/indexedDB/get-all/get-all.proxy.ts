/// <reference lib="dom" />

const buildFakeGetAllRequest = ({
  records,
  errorMessage,
}: {
  records: unknown[];
  errorMessage: string | null;
}): IDBRequest<unknown[]> => {
  const request: {
    result: unknown[];
    error: { message: string } | null;
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
  } = {
    result: records,
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

  return request as unknown as IDBRequest<unknown[]>;
};

export const getAllProxy = (): {
  buildDb: (params: { records: unknown[] }) => IDBDatabase;
  buildFailingDb: (params: { errorMessage: string }) => IDBDatabase;
  getCallsFor: () => readonly unknown[][];
} => {
  // The fake db this proxy hands out ignores storeName entirely — it always returns the same
  // staged records or the same staged failure, regardless of what getAll passes — so there is
  // nothing to stage a tolerant address FOR. What a caller test still needs is read-back: which
  // storeName getAll actually called `getAll()` against.
  const calls: unknown[][] = [];

  const buildDb = ({
    records,
    errorMessage,
  }: {
    records: unknown[];
    errorMessage: string | null;
  }): IDBDatabase =>
    ({
      transaction: (): unknown => ({
        objectStore: (storeName: string): unknown => ({
          getAll: (): IDBRequest<unknown[]> => {
            calls.push([storeName]);
            return buildFakeGetAllRequest({ records, errorMessage });
          },
        }),
      }),
    }) as unknown as IDBDatabase;

  return {
    buildDb: ({ records }: { records: unknown[] }): IDBDatabase =>
      buildDb({ records, errorMessage: null }),
    buildFailingDb: ({ errorMessage }: { errorMessage: string }): IDBDatabase =>
      buildDb({ records: [], errorMessage }),
    getCallsFor: (): readonly unknown[][] => calls,
  };
};
