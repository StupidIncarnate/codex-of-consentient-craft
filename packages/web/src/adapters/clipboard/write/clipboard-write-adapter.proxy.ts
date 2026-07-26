import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const clipboardWriteAdapterProxy = (): {
  succeeds: (params: { text: string }) => void;
  throws: (params: { text: string; error: Error }) => void;
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

  const handle: SpyOnHandle = registerSpyOn({
    object: globalThis.navigator.clipboard,
    method: 'writeText',
  });

  return {
    succeeds: ({ text }: { text: string }): void => {
      handle.calledWith([text]).resolves(undefined);
    },
    throws: ({ text, error }: { text: string; error: Error }): void => {
      handle.calledWith([text]).rejects(error);
    },
    getWrittenText: (): unknown => handle.callsMatching([]).at(-1)?.[0],
  };
};
