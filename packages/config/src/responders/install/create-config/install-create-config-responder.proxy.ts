import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreateConfigResponder } from './install-create-config-responder';

// Every test in this file calls the responder with this fixed targetProjectRoot, so this is
// the one real config path join/access/write are ever called with here.
const TARGET_PROJECT_ROOT = '/project';
const CONFIG_PATH = FilePathStub({
  value: `${TARGET_PROJECT_ROOT}/${locationsStatics.repoRoot.config}`,
});

export const InstallCreateConfigResponderProxy = (): {
  callResponder: typeof InstallCreateConfigResponder;
  setupConfigExists: () => void;
  setupConfigNotExists: () => void;
} => {
  const joinProxy = pathJoinAdapterProxy();
  const accessProxy = fsAccessAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  // join is call-order-scoped (see THE JOIN/DIRNAME/BASENAME TRAP in
  // path-join-adapter.proxy.ts); TARGET_PROJECT_ROOT documents the one real call this proxy
  // ever answers, it isn't used to key the mock.
  joinProxy.returns({ result: CONFIG_PATH });

  return {
    callResponder: InstallCreateConfigResponder,

    setupConfigExists: (): void => {
      accessProxy.resolves({ filePath: CONFIG_PATH });
    },

    setupConfigNotExists: (): void => {
      accessProxy.rejects({ filePath: CONFIG_PATH, error: new Error('ENOENT') });
      writeProxy.succeeds({
        filepath: CONFIG_PATH,
        contents: FileContentsStub({ value: '{}' }),
      });
    },
  };
};
