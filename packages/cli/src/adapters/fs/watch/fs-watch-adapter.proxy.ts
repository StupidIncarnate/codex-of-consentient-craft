import { watch } from 'fs';
import type { FSWatcher } from 'fs';

jest.mock('fs', () => ({
  watch: jest.fn(),
}));

export const fsWatchAdapterProxy = (): {
  emitsChange: (params: { filename: string }) => void;
  wasClosed: () => boolean;
  throwsOnWatch: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(watch);
  const state = {
    capturedCallback: null as ((eventType: string, filename: string | null) => void) | null,
    closed: false,
  };

  const mockWatcher: Partial<FSWatcher> = {
    close: (): void => {
      state.closed = true;
    },
  };

  mock.mockImplementation((_path, callback) => {
    state.capturedCallback = callback as (eventType: string, filename: string | null) => void;
    return mockWatcher as FSWatcher;
  });

  return {
    emitsChange: ({ filename }: { filename: string }): void => {
      if (state.capturedCallback) {
        state.capturedCallback('change', filename);
      }
    },

    wasClosed: (): boolean => state.closed,

    throwsOnWatch: ({ error }: { error: Error }): void => {
      mock.mockImplementation(() => {
        throw error;
      });
    },
  };
};
