import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  pathExistsProxy,
  readJsonFileIfExistsProxy,
  writeFileProxy,
} from '@dungeonmaster/node/testing';
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
  setupExistingConfigUnreadable: ({ error }: { error: unknown }) => void;
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

    // Stages an existing file the read itself fails on: invalid JSON (a real SyntaxError from
    // readJsonFile) or an fs-level failure such as EACCES (an FsErrorStub) — both reach the
    // responder as a rejection off readJsonFileIfExists, never as a resolved `null`.
    setupExistingConfigUnreadable: ({ error }: { error: unknown }): void => {
      existsProxy.present({ path: CONFIG_PATH });
      readProxy.rejects({ path: CONFIG_PATH, error });
    },

    setupWriteSucceeds: (): void => {
      writeProxy.succeeds({ path: CONFIG_PATH });
    },

    getWrittenConfig: (): unknown => writeProxy.writtenContentsFor({ path: CONFIG_PATH }),
  };
};
