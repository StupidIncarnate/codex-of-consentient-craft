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
} => {
  const buildDb = ({
    key,
    errorMessage,
  }: {
    key: IDBValidKey;
    errorMessage: string | null;
  }): IDBDatabase =>
    ({
      transaction: (): unknown => ({
        objectStore: (): unknown => ({
          put: (): IDBRequest<IDBValidKey> => buildFakePutRequest({ key, errorMessage }),
        }),
      }),
    }) as unknown as IDBDatabase;

  return {
    buildDb: ({ key }: { key: IDBValidKey }): IDBDatabase => buildDb({ key, errorMessage: null }),
    buildFailingDb: ({ errorMessage }: { errorMessage: string }): IDBDatabase =>
      buildDb({ key: 0, errorMessage }),
  };
};
