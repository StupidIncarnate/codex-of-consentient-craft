import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { InstallCreateConfigResponder } from './install-create-config-responder';

// Every test in this file calls the responder with this fixed targetProjectRoot, so this is
// the one real config path exists/read/write are ever called with here.
const TARGET_PROJECT_ROOT = '/project';
const CONFIG_PATH = FilePathStub({
  value: `${TARGET_PROJECT_ROOT}/${locationsStatics.repoRoot.config}`,
});

export const InstallCreateConfigResponderProxy = (): {
  callResponder: typeof InstallCreateConfigResponder;
  setupConfigNotExists: () => void;
  setupExistingConfigContent: ({ content }: { content: string }) => void;
  setupExistingConfigUnreadable: () => void;
  setupWriteSucceeds: () => void;
  getWrittenConfig: () => unknown;
} => {
  const existsProxy = pathExistsProxy();
  const readProxy = readJsonFileIfExistsProxy();
  const writeProxy = writeFileProxy();

  return {
    callResponder: InstallCreateConfigResponder,

    setupConfigNotExists: (): void => {
      existsProxy.missing({ path: CONFIG_PATH });
      writeProxy.succeeds({ path: CONFIG_PATH });
    },

    // Stages an existing .dungeonmaster.json whose body is exactly `content` — valid JSON, or
    // JSON that fails the config contract, are both the same call shape from here.
    setupExistingConfigContent: ({ content }: { content: string }): void => {
      existsProxy.present({ path: CONFIG_PATH });
      readProxy.returnsRaw({ path: CONFIG_PATH, rawContents: content });
    },

    // Stages an existing file the read itself fails on with EACCES — a recorded failure the
    // gateway's own proxy builds, reaching the responder as a rejection off readJsonFileIfExists,
    // never as a resolved `null`.
    setupExistingConfigUnreadable: (): void => {
      existsProxy.present({ path: CONFIG_PATH });
      readProxy.denied({ path: CONFIG_PATH });
    },

    setupWriteSucceeds: (): void => {
      writeProxy.succeeds({ path: CONFIG_PATH });
    },

    getWrittenConfig: (): unknown => writeProxy.writtenContentsFor({ path: CONFIG_PATH }),
  };
};
