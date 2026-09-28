import { verifyRefProxy } from '#gateway/bin/git/verify-ref/verify-ref.proxy';

// Each probe is staged by its exact ref, so the main and master answers are independent and can be
// staged in either order.
const MISSING = 128;
const FOUND = 0;

const extractArgs = (call: readonly unknown[]): readonly unknown[] => {
  const [first] = call;
  if (typeof first === 'object' && first !== null && 'args' in first) {
    return Array.isArray(first.args) ? first.args : [];
  }
  return [];
};

export const gitDetectBaseBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const verifyProxy = verifyRefProxy();

  return {
    setupMainExists: (): void => {
      verifyProxy.setupResult({ ref: 'main', exitCode: FOUND });
    },

    setupMasterExists: (): void => {
      verifyProxy.setupResult({ ref: 'main', exitCode: MISSING });
      verifyProxy.setupResult({ ref: 'master', exitCode: FOUND });
    },

    setupNeitherExists: (): void => {
      verifyProxy.setupResult({ ref: 'main', exitCode: MISSING });
      verifyProxy.setupResult({ ref: 'master', exitCode: MISSING });
    },

    getSpawnedArgsList: (): readonly unknown[] =>
      verifyProxy
        .getCallsFor({ ref: (arg: unknown): boolean => typeof arg === 'string' })
        .map(extractArgs),
  };
};
