/// <reference lib="dom" />

const buildFakeDeleteRequest = ({
  errorMessage,
}: {
  errorMessage: string | null;
}): IDBRequest<undefined> => {
  const request: {
    error: { message: string } | null;
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
  } = {
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

  return request as unknown as IDBRequest<undefined>;
};

export const deleteRecordProxy = (): {
  buildDb: () => IDBDatabase;
  buildFailingDb: (params: { errorMessage: string }) => IDBDatabase;
  getCallsFor: () => readonly unknown[][];
} => {
  // The fake db this proxy hands out ignores storeName/key entirely — it always succeeds or
  // always fails, regardless of what deleteRecord passes — so there is nothing to stage a
  // tolerant address FOR. What a caller test still needs is read-back: which storeName and key
  // deleteRecord actually called `delete()` with.
  const calls: unknown[][] = [];

  const buildDb = ({ errorMessage }: { errorMessage: string | null }): IDBDatabase =>
    ({
      transaction: (): unknown => ({
        objectStore: (storeName: string): unknown => ({
          delete: (key: IDBValidKey): IDBRequest<undefined> => {
            calls.push([storeName, key]);
            return buildFakeDeleteRequest({ errorMessage });
          },
        }),
      }),
    }) as unknown as IDBDatabase;

  return {
    buildDb: (): IDBDatabase => buildDb({ errorMessage: null }),
    buildFailingDb: ({ errorMessage }: { errorMessage: string }): IDBDatabase =>
      buildDb({ errorMessage }),
    getCallsFor: (): readonly unknown[][] => calls,
  };
};
