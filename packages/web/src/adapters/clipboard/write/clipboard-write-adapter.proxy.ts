import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const clipboardWriteAdapterProxy = (): {
  succeeds: (params: { text: string }) => void;
  throws: (params: { text: string; error: Error }) => void;
  wasWrittenWith: (params: { text: string }) => boolean;
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
    // writeText takes a single argument, so the address IS the value under test — reading it
    // back through the same address would just echo what was passed in. An existence check
    // (was writeText ever called with exactly this text) proves the same thing honestly.
    wasWrittenWith: ({ text }: { text: string }): boolean =>
      handle.callsMatching([text]).length > 0,
  };
};
