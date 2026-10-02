import { moduleResolveBrokerProxy } from '@dungeonmaster/shared/brokers/module/resolve/module-resolve-broker.proxy';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';

import { CliSiegelenseResponder } from './cli-siegelense-responder';

const USER_CWD = '/repo/worktrees/quest-a';
const SIEGELENSE_SPECIFIER = '@dungeonmaster/siegelense/startup';
// The module resolves from the user's cwd, so the dynamic import is addressed by the path that
// resolution answers with.
const SIEGELENSE_PATH = `${USER_CWD}/node_modules/@dungeonmaster/siegelense/dist/startup.js`;

export const CliSiegelenseResponderProxy = (): {
  callResponder: typeof CliSiegelenseResponder;
  setupModule: (params: { StartSiegelense: jest.Mock }) => void;
  setupImportFailure: (params: { error: Error }) => void;
} => {
  const importProxy = dynamicImportProxy();
  const cwdStage = cwdProxy();
  const moduleStage = moduleResolveBrokerProxy();

  return {
    callResponder: CliSiegelenseResponder,

    setupModule: ({ StartSiegelense }: { StartSiegelense: jest.Mock }): void => {
      cwdStage.setupCwd({ value: USER_CWD });
      moduleStage.setupResolvesFromRunRoot({
        specifier: SIEGELENSE_SPECIFIER,
        repoRoot: USER_CWD,
        path: SIEGELENSE_PATH,
      });
      importProxy.returns({ path: SIEGELENSE_PATH, module: { StartSiegelense } });
    },

    setupImportFailure: ({ error }: { error: Error }): void => {
      cwdStage.setupCwd({ value: USER_CWD });
      moduleStage.setupResolvesFromRunRoot({
        specifier: SIEGELENSE_SPECIFIER,
        repoRoot: USER_CWD,
        path: SIEGELENSE_PATH,
      });
      importProxy.rejects({ path: SIEGELENSE_PATH, error });
    },
  };
};
