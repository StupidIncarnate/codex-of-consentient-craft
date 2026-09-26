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
} => {
  const buildDb = ({
    records,
    errorMessage,
  }: {
    records: unknown[];
    errorMessage: string | null;
  }): IDBDatabase =>
    ({
      transaction: (): unknown => ({
        objectStore: (): unknown => ({
          getAll: (): IDBRequest<unknown[]> => buildFakeGetAllRequest({ records, errorMessage }),
        }),
      }),
    }) as unknown as IDBDatabase;

  return {
    buildDb: ({ records }: { records: unknown[] }): IDBDatabase =>
      buildDb({ records, errorMessage: null }),
    buildFailingDb: ({ errorMessage }: { errorMessage: string }): IDBDatabase =>
      buildDb({ records: [], errorMessage }),
  };
};
