import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const clipboardWriteAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getWrittenText: () => unknown;
} => {
  // jsdom does not implement `navigator.clipboard` by default, so attach a real
  // method to spy on. Object.defineProperty is the only way to set the read-only
  // `clipboard` slot on the Navigator prototype.
  const navigator = globalThis.navigator as {
    clipboard?: { writeText: (text: string) => Promise<void> };
  };
  if (!navigator.clipboard) {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: async (_text: string): Promise<void> => Promise.resolve() },
      configurable: true,
      writable: true,
    });
  }

  const handle = registerSpyOn({ object: globalThis.navigator.clipboard, method: 'writeText' });
  handle.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getWrittenText: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },
  };
};
