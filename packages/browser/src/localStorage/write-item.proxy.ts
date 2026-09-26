import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const writeItemProxy = (): {
  setupWriteFails: (params: { key: string; value: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({
    object: Storage.prototype,
    method: 'setItem',
    passthrough: true,
  });

  return {
    setupWriteFails: ({
      key,
      value,
      error,
    }: {
      key: string;
      value: string;
      error: Error;
    }): void => {
      handle.calledWith([key, value]).throws(error);
    },
  };
};
