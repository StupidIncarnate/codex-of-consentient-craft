import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { ValueMatcher } from '../../gateway-test-support/value-matcher';

export const readItemProxy = (): {
  setupReadFails: (params: { key: string; error: Error }) => void;
  throwsMatchingKey: (params: { key: ValueMatcher; error: Error }) => void;
  getCallsFor: (params: { key: ValueMatcher }) => readonly unknown[][];
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

    throwsMatchingKey: ({ key, error }: { key: ValueMatcher; error: Error }): void => {
      handle.calledWith([key]).throws(error);
    },

    getCallsFor: ({ key }: { key: ValueMatcher }): readonly unknown[][] =>
      handle.callsMatching([key]),
  };
};
