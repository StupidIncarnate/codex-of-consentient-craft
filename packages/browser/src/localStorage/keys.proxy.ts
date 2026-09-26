import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const keysProxy = (): {
  setupEnumerationFails: (params: { error: Error }) => void;
} => {
  const handle = registerSpyOn({
    object: Storage.prototype,
    method: 'key',
    passthrough: true,
  });

  return {
    // Storage.length still reads real (jsdom does not model a length read failing
    // independently of key()), so a scan that has at least one entry to enumerate is what
    // reaches this throw.
    setupEnumerationFails: ({ error }: { error: Error }): void => {
      handle.calledWith([0]).throws(error);
    },
  };
};
