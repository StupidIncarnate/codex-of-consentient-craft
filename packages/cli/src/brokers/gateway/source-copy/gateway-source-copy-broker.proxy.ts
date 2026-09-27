import { cp } from '#gateway/node/fs__promises';
import { resolvePackageRootProxy } from '#gateway/node/_test_/module';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const gatewaySourceCopyBrokerProxy = (): {
  copySucceeds: () => void;
  copiedSources: () => readonly unknown[];
} => {
  // resolvePackageRoot runs real, against the real installed workspace packages.
  resolvePackageRootProxy();
  const cpHandle = registerMock({ fn: cp });

  return {
    // Catch-all: the source directory is the real resolved install location, which a test cannot
    // name in advance; copiedPairs() is what the test asserts on.
    copySucceeds: (): void => {
      cpHandle.calledWith([]).resolves(undefined);
    },
    copiedSources: (): readonly unknown[] => cpHandle.callsMatching([]).map(([source]) => source),
  };
};
