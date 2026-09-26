import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const writeItemProxy = (): {
  setupWriteFails: (params: { key: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({
    object: Storage.prototype,
    method: 'setItem',
    passthrough: true,
  });

  return {
    // Matches on key alone, a prefix match against the real setItem(key, value) call — like
    // readItemProxy/removeItemProxy/keysProxy, so a caller can fail a write without predicting
    // the exact value it is about to serialize.
    setupWriteFails: ({ key, error }: { key: string; error: Error }): void => {
      handle.calledWith([key]).throws(error);
    },
  };
};
