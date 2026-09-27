import { dynamicImport } from '#gateway/node/module';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { CliSiegelenseResponder } from './cli-siegelense-responder';

export const CliSiegelenseResponderProxy = (): {
  callResponder: typeof CliSiegelenseResponder;
  setupModule: (params: { StartSiegelense: jest.Mock }) => void;
  setupImportFailure: (params: { error: Error }) => void;
} => {
  // dynamicImportProxy() offers no staging of its own (a language primitive, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses dynamicImport itself directly, keyed on the module specifier.
  dynamicImportProxy();
  const importHandle = registerMock({ fn: dynamicImport });
  // The responder resolves its module specifier via require.resolve('@dungeonmaster/siegelense/startup')
  // — not a literal we can write ahead of time (it depends on the host's node_modules layout). Calling
  // the identical require.resolve() here, in the same process and directory, reproduces the exact
  // address the responder's own call computes, so this is the real value, not a guess.
  const siegelensePath = require.resolve('@dungeonmaster/siegelense/startup');

  return {
    callResponder: CliSiegelenseResponder,

    setupModule: ({ StartSiegelense }: { StartSiegelense: jest.Mock }): void => {
      importHandle.calledWith([{ path: siegelensePath }]).resolves({ StartSiegelense });
    },

    setupImportFailure: ({ error }: { error: Error }): void => {
      importHandle.calledWith([{ path: siegelensePath }]).rejects(error);
    },
  };
};
