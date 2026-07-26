import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const httpReadinessPollAdapterProxy = (): {
  respondsWithStatus: (params: { url: string; status: number; ok: boolean }) => void;
  respondsWithStatuses: (params: {
    url: string;
    statuses: { status: number; ok: boolean }[];
  }) => void;
  throwsNetworkError: (params: { url: string; error: Error }) => void;
} => {
  const counter = { value: 0 };
  const dateNowHandle = registerSpyOn({ object: Date, method: 'now' });
  // Date.now() takes no arguments — there is no real value to key on.
  dateNowHandle.calledWith([]).implement(() => {
    const current = counter.value;
    counter.value += 100;
    return current;
  });

  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    respondsWithStatus: ({
      url,
      status,
      ok,
    }: {
      url: string;
      status: number;
      ok: boolean;
    }): void => {
      handle.calledWith([url]).resolves({ status, ok } as Response);
    },

    respondsWithStatuses: ({
      url,
      statuses,
    }: {
      url: string;
      statuses: { status: number; ok: boolean }[];
    }): void => {
      for (const entry of statuses) {
        handle.onceFor([url]).resolves({ status: entry.status, ok: entry.ok } as Response);
      }
    },

    throwsNetworkError: ({ url, error }: { url: string; error: Error }): void => {
      handle.onceFor([url]).rejects(error);
    },
  };
};
