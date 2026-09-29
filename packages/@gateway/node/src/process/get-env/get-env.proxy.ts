import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import * as getEnvModule from './get-env';

// The wrapper's own module is the seam a caller's test stages, addressed by the exact variable name.
// A spy on the module object, not a mock of the module: the barrel re-exports `getEnv` through a
// getter that reads this object at call time, so a caller reaches the spy however it imported the
// function, and no hoisted module mock replaces `getEnv` for a test that never stages a variable.
// Nothing is spied until a test calls a method, and `passthrough: true` sends every name that is not
// staged to the real `process.env` read. `value: undefined` stages an unset variable.
export const getEnvProxy = (): {
  setupEnv: (params: { name: string; value: string | undefined }) => void;
  getCallsFor: (params: { name: string }) => readonly unknown[][];
} => ({
  setupEnv: ({ name, value }: { name: string; value: string | undefined }): void => {
    registerSpyOn({ object: getEnvModule, method: 'getEnv', passthrough: true })
      .calledWith([name])
      .returns(value);
  },
  getCallsFor: ({ name }: { name: string }): readonly unknown[][] =>
    registerSpyOn({ object: getEnvModule, method: 'getEnv', passthrough: true }).callsMatching([
      name,
    ]),
});
