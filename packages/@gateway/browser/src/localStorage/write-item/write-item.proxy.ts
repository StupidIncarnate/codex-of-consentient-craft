import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { ValueMatcher } from '../../gateway-test-support/value-matcher';

export const writeItemProxy = (): {
  setupWriteFails: (params: { key: string; error: Error }) => void;
  throwsMatchingKey: (params: { key: ValueMatcher; error: Error }) => void;
  getCallsFor: (params: { key: ValueMatcher }) => readonly unknown[][];
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

    throwsMatchingKey: ({ key, error }: { key: ValueMatcher; error: Error }): void => {
      handle.calledWith([key]).throws(error);
    },

    // Prefix-addressed, so the recorded call still carries the real value setItem serialized —
    // `callsMatching([key]).at(-1)?.[1]` reads it back.
    getCallsFor: ({ key }: { key: ValueMatcher }): readonly unknown[][] =>
      handle.callsMatching([key]),
  };
};
