import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const httpReadinessPollAdapterProxy = (): {
  respondsWithStatus: (params: { status: number; ok: boolean }) => void;
  respondsWithStatuses: (params: { statuses: { status: number; ok: boolean }[] }) => void;
  throwsNetworkError: (params: { error: Error }) => void;
} => {
  const counter = { value: 0 };
  const dateNowHandle = registerSpyOn({ object: Date, method: 'now' });
  dateNowHandle.mockImplementation(() => {
    const current = counter.value;
    counter.value += 100;
    return current;
  });

  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  handle.mockResolvedValue({ status: 200, ok: true } as Response);

  return {
    respondsWithStatus: ({ status, ok }: { status: number; ok: boolean }): void => {
      handle.mockResolvedValue({ status, ok } as Response);
    },

    respondsWithStatuses: ({ statuses }: { statuses: { status: number; ok: boolean }[] }): void => {
      for (const entry of statuses) {
        handle.mockResolvedValueOnce({ status: entry.status, ok: entry.ok } as Response);
      }
    },

    throwsNetworkError: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
