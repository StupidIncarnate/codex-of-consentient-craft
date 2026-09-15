import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';

import { CliSiegelenseResponder } from './cli-siegelense-responder';

export const CliSiegelenseResponderProxy = (): {
  callResponder: typeof CliSiegelenseResponder;
  setupModule: (params: { StartSiegelense: jest.Mock }) => void;
  setupImportFailure: (params: { error: Error }) => void;
} => {
  const importProxy = runtimeDynamicImportAdapterProxy();
  // The responder resolves its module specifier via require.resolve('@dungeonmaster/siegelense/startup')
  // — not a literal we can write ahead of time (it depends on the host's node_modules layout). Calling
  // the identical require.resolve() here, in the same process and directory, reproduces the exact
  // address the responder's own call computes, so this is the real value, not a guess.
  const siegelensePath = require.resolve('@dungeonmaster/siegelense/startup');

  return {
    callResponder: CliSiegelenseResponder,

    setupModule: ({ StartSiegelense }: { StartSiegelense: jest.Mock }): void => {
      importProxy.succeeds({ path: siegelensePath, module: { StartSiegelense } });
    },

    setupImportFailure: ({ error }: { error: Error }): void => {
      importProxy.throws({ path: siegelensePath, error });
    },
  };
};
