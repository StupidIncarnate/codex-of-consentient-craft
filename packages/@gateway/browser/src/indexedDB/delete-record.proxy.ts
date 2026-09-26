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
} => {
  const buildDb = ({ errorMessage }: { errorMessage: string | null }): IDBDatabase =>
    ({
      transaction: (): unknown => ({
        objectStore: (): unknown => ({
          delete: (): IDBRequest<undefined> => buildFakeDeleteRequest({ errorMessage }),
        }),
      }),
    }) as unknown as IDBDatabase;

  return {
    buildDb: (): IDBDatabase => buildDb({ errorMessage: null }),
    buildFailingDb: ({ errorMessage }: { errorMessage: string }): IDBDatabase =>
      buildDb({ errorMessage }),
  };
};
