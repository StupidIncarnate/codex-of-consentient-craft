import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const readItemProxy = (): {
  setupReadFails: (params: { key: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({
    object: Storage.prototype,
    method: 'getItem',
    passthrough: true,
  });

  return {
    setupReadFails: ({ key, error }: { key: string; error: Error }): void => {
      handle.calledWith([key]).throws(error);
    },
  };
};
