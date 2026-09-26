import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const removeItemProxy = (): {
  setupRemoveFails: (params: { key: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({
    object: Storage.prototype,
    method: 'removeItem',
    passthrough: true,
  });

  return {
    setupRemoveFails: ({ key, error }: { key: string; error: Error }): void => {
      handle.calledWith([key]).throws(error);
    },
  };
};
